const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Employee = new Schema();
const Company = new Schema();

Company.add({
    name: { type: String },
    size: { type: String, enum: ['small', 'medium', 'large'] },
    location: { type: String, index: true }
});

Employee.add({
    firstname: { type: String },
    lastname: { type: String },
    age: { type: Number },
    email: { type: String },
    company: Company
});

const employeeModel = mongoose.model('Employee', Employee);

module.exports = employeeModel
