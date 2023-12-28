const { fakerTH : faker} = require('@faker-js/faker');

// Function to generate fake data using faker.js
function generateFakeData(targets) {
    let data = {};
    for (var i = 0; i < targets.length; i++) {
        switch (targets[i]){
        case '$fullname':
            data[i] = faker.person.fullName();
            break;
        case '$email':
            data[i] = faker.internet.email();
            break;
        case '$address':
            data[i] = faker.location.streetAddress();
            break;
        case '$city':
            data[i] = faker.location.city();
            break;
        case '$country':
            data[i] = faker.location.country();
            break;
        default:
            data[i] = targets[i];
        }
    }
    return data;
}

module.exports = { generateFakeData };