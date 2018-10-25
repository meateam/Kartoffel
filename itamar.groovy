
pipeline {
    agent none
    stages {
        stage ('unit-testing') {
            agent {
                label 'kartoffel-dev'
            }
            when {
            not { branch 'devops' }
            }            
            steps {
                sh 'sudo service mongod start'
                sh 'npm install'
                sh 'NODE_ENV=dev MONGODB_TEST_URI=mongodb://localhost:27017/organizationGroupTest SESSION_SECRET=just_an_exampl npm test'
            }
        }
        stage ('deploy') {
            agent {
                label 'kartoffel-prod'
            }
            when { branch 'devops' }
            steps {
                sh 'sudo service mongod start'
                sh 'sudo npm install pm2 -g'
                sh 'npm install'
                sh 'npm run build'
                sh 'NODE_ENV=dev MONGODB_URI=mongodb://localhost:27017/kartoffel SESSION_SECRET=just_an_example pm2 start dist/server.js --name kartoffel-server'
            }
        }    
    }
}
