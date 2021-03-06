import { Request, Response, NextFunction } from 'express';
import { PersonRepository } from './person.repository';
import { IPerson } from './person.interface';
import { IOrganizationGroup } from '../group/organizationGroup/organizationGroup.interface';
import { OrganizationGroup } from '../group/organizationGroup/organizationGroup.controller';
import { OrganizationGroupRepository } from '../group/organizationGroup/organizationGroup.repository';
import { userFromString } from '../domainUser/domainUser.utils';
import { DomainUserController } from '../domainUser/domainUser.controller';
import { IDomainUser } from '../domainUser/domainUser.interface';
import * as utils from '../utils.js';
import { filterPersonDomainUsers } from './person.utils';
import { DomainUserValidate } from '../domainUser/domainUser.validators';
import  * as consts  from '../config/db-enums';

export class Person {
  static _personRepository: PersonRepository = new PersonRepository();
  _personService: PersonRepository;
  static _organizationGroupRepository: OrganizationGroupRepository = new OrganizationGroupRepository();

  constructor() {
    this._personService = new PersonRepository();
  }

  static async getPersons(query?: any): Promise<IPerson[]> {
    const cond = {};
    if (!(query && query.alsoDead && query.alsoDead === 'true')) cond['alive'] = 'true';
    let persons: IPerson[] = await Person._personRepository.find(cond, 'primaryDomainUser secondaryDomainUsers');
    persons = persons.map(person => filterPersonDomainUsers(person));
    return <IPerson[]>persons;
  }

  static async getPersonById(personID: string): Promise<IPerson> {
    const person = await Person._personRepository.findById(personID);
    if (!person) return Promise.reject(new Error('Cannot find person with ID: ' + personID));
    return person;
  }

  static async getPersonByIdWithFilter(personID: string): Promise<IPerson> {
    let person: IPerson = await Person.getPersonById(personID);
    person = filterPersonDomainUsers(person);
    return person;
  }

  static async getPerson(nameField: string, identityValue: string): Promise<IPerson> {
    const cond = {};
    cond[nameField] = identityValue;
    let person: IPerson = await Person._personRepository.findOne(cond);
    if (!person) return Promise.reject(new Error(`Cannot find person with ${nameField}: '${identityValue}'`));
    person = filterPersonDomainUsers(person);
    return person;
  }
  static async getPersonByIdentifier(nameFields: string[], identityValue: string) {
    let person: IPerson = await Person._personRepository.findOneOr(nameFields, [identityValue]);
    if (!person) return Promise.reject(new Error(`Cannot find person with identityValue: '${identityValue}'`));
    person = filterPersonDomainUsers(person);
    return person;
  }
  static async getUpdatedFrom(from: Date, to: Date) {
    const persons = await Person._personRepository.getUpdatedFrom(from, to);
    return <IPerson[]>persons;
  }

  static async getByDomainUserString(userString: string): Promise<IPerson> {
    const user = await DomainUserController.getByUniqueID(userString);
    if (user && user.personId) {
      return await Person.getPersonByIdWithFilter(<string>user.personId);
    }
    return null;
  }

  static async addNewUser(personId: string, user: IDomainUser | string, isPrimary: boolean):
    Promise<IPerson> {
    if (!personId) return Promise.reject(new Error(`The system needs a personId to create a domain user ${JSON.stringify(user)}`));
    if (!user) return Promise.reject(new Error(`The system needs a user name and domain to create a domain user for a personId ${personId}`));
    const userObj: IDomainUser = typeof user === 'string' ? userFromString(user) : user;
    if (!DomainUserValidate.domain(userObj.domain)) return Promise.reject(new Error(`'The "${userObj.domain}" is not a recognized domain'`));
    // get the person (it also checks that the person exists)
    const person = await Person.getPersonById(personId);
    // connect the user to the person
    userObj.personId = personId;
    const newUser = await DomainUserController.create(userObj);
    // connect the person to the user
    if (isPrimary) {
      // if the person already has primary user - make it secondary
      if (person.primaryDomainUser) {
        // the primary user is populated 
        (<IDomainUser[]>person.secondaryDomainUsers).push(<IDomainUser>person.primaryDomainUser);
      }
      person.primaryDomainUser = newUser;
    } else {
      // fuck you mongoose! I am using copy only because of your stupid 'push'
      const copy: IDomainUser[] = <IDomainUser[]>person.secondaryDomainUsers.slice();
      copy.push(newUser);
      person.secondaryDomainUsers = copy;
    }
    const updatedPerson = await Person.updatePerson(personId, person);
    return updatedPerson;
  }


  static async createPerson(person: IPerson): Promise<IPerson> {
    // check that 'directGroup' field exists
    if (!person.directGroup) {
      throw new Error('a person must have a direct group');
    }  
    // delete empty or null field that are not necessary
    utils.filterEmptyField(person, ['rank', 'phone', 'mobilePhone', 'address', 'job', 'serviceType']);
    
    // Chack some validation
    // Check if personalNumber equal to identityCard
    if (person.personalNumber && person.identityCard && person.personalNumber === person.identityCard) {
      throw new Error('The personal number and identity card with the same value');
    }
    // Checks if there is a rank for the person who needs to
    if (person.entityType === consts.ENTITY_TYPE[1] && !person.rank) person.rank = consts.RANK[0];
    // Checks whether the value in personalNumber or identityNumber exists in one of them
    // Checks value that exist
    const existValue = [person.personalNumber, person.identityCard].filter(x => x != null);
    const result = await Person._personRepository.findOr(['personalNumber', 'identityCard'], existValue);
    if (result.length > 0) throw new Error('The personal number or identity card exists');
    // get direct group - will throw error if the group doesn`t exist
    const directGroup = await OrganizationGroup.getOrganizationGroup(<string>person.directGroup);
    // create the person's hierarchy
    person.hierarchy = directGroup.hierarchy.concat(directGroup.name);
    const newPerson = await Person._personRepository.create(person);
    return newPerson;
  }

  /**
   * maybe in the future we will support creating the person and it's users at the same time
   */
  // static async createPerson(person: IPerson): Promise<IPerson> {
  //   const { primaryDomainUser, secondaryDomainUsers, ...toCreate } = person;
  //   const tmpPerson = await Person._personRepository.create(toCreate);
  //   // create the domain users while ignoring illegals
  //   const domainUsers = [primaryDomainUser, ...secondaryDomainUsers];
  //   const [primaryUser, ...secondaryUsers] = await DomainUserController
  //     .createManyFromString(<string[]>domainUsers, tmpPerson.id);
  //   const SecondaryUsersIds = secondaryUsers.filter(u => u ? true : false).map(u => u.id);
  //   const primaryUserId = primaryUser? primaryUser.id : null;
  //   // add the created domain users to the person
  //   let update: Partial<IPerson> = {};
  //   if (SecondaryUsersIds.length !== 0) {
  //     update.secondaryDomainUsers = SecondaryUsersIds;
  //   }
  //   if (primaryUserId) {
  //     update.primaryDomainUser = primaryUserId;
  //   }
  //   const createdPerson = await Person.updatePerson(tmpPerson.id, update);
  //   return createdPerson;
  // }

  static async discharge(personID: string): Promise<any> {
    const person = await Person.getPersonById(personID);
    person.alive = false;
    if (person.managedGroup) {
      person.managedGroup = null;
    }
    const res = await Person.updatePerson(personID, person);
    return res;
  }

  static async removePerson(personID: string): Promise<any> {
    const res = await Person._personRepository.delete(personID);
    return res.result.n > 0 ? res.result : Promise.reject(new Error('Cannot find person with ID: ' + personID));
  }

  static async updatePerson(id: string, change: Partial<IPerson>): Promise<IPerson> {
    let updatedPerson = await Person._personRepository.update(id, change, 'primaryDomainUser secondaryDomainUsers');
    if (!updatedPerson) return Promise.reject(new Error('Cannot find person with ID: ' + id));
    updatedPerson = filterPersonDomainUsers(updatedPerson);
    return <IPerson>updatedPerson;
  }

  static async updateTeam(personID: string, newTeamID: string): Promise<IPerson> {
    const person = await Person.getPersonById(personID);
    person.directGroup = newTeamID;
    return await Person.updatePerson(personID, person);
  }

  // Will transfer person between groups automatically. Is that what we want?
  static async assign(personID: string, groupID: string): Promise<IPerson> {
    let person = await Person.getPersonById(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);

    person.directGroup = group.id;
    person.hierarchy = group.hierarchy.concat(group.name);
    person = await Person.updatePerson(personID, person);
    return <IPerson>person;
  }

  // Will delete managedGroup too
  // static async dismiss(personID: string) {
  //   let person = await Person.getPersonById(personID);
  //   if (!person.directGroup) return;

  //   person.directGroup = null;
  //   if (person.managedGroup) person.managedGroup = null;
  //   person = await Person.updatePerson(personID, person);
  //   return person;
  // }

  static async manage(personID: string, groupID: string) {
    const person = await Person.getPersonById(personID);
    const group = await OrganizationGroup.getOrganizationGroup(groupID);

    if (String(person.directGroup) !== String(groupID)) {
      return Promise.reject(new Error('This person is not a member in this group, hence can not be appointed as a leaf'));
    }
    // else
    person.managedGroup = group.id;
    await Person.updatePerson(personID, person);
    return;
  }

  static async resign(personID: string) {
    const person = await Person.getPersonById(personID);
    person.managedGroup = undefined;
    await Person.updatePerson(personID, person);
  }
}
