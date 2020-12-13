const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employee = require('../model/employee');

const dbConnect = async () => {
  await mongoose.connect('mongodb://localhost/Test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });
}

//Retrieve all employees.
router.get('/', async (req, res) => {
  await dbConnect();
  let list;
  if (req.query && req.query.companysize) {
    list = await Employee.find({'company.size': req.query.companysize});
  } else if (req.query && req.query.location) {
    list = await Employee.find({'company.location': req.query.location});
  } else {
    list = await Employee.find({});
  }

  return res.json(list);
});

//Create an employee.
router.put('/', async (req, res) => {
  await dbConnect();
  try {
    //TODO: Validate the request structure

    const employee = new Employee();
    // Check for duplicate employees.
    let existingEmployee = await Employee.findOne({
      'firstname': req.body.firstname,
      'lastname': req.body.lastname
    });
    if (existingEmployee) return res.status(400).send("An employee with the same name already exists!");
    // Check for existing companies.
    existingEmployee = await Employee.findOne({ 'company.location': req.body.company.location});

    employee.firstname = req.body.firstname;
    employee.lastname = req.body.lastname;
    employee.age = req.body.age;
    employee.email = `${req.body.firstname}.${req.body.lastname[0]}@${req.body.company.name}.com.au`;
    employee.company = existingEmployee ? existingEmployee.company : req.body.company;
    await employee.save();
    return res.status(200).send();
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

//Update an employee.
router.post('/:id', async (req, res) => {
  await dbConnect();
  try {
    const employee = await Employee.findById(req.params.id);
    //TODO: Validate the request structure
    employee.firstname = req.body.firstname || employee.firstname;
    employee.lastname = req.body.lastname || employee.lastname;
    employee.age = req.body.age || employee.age;
    employee.company = req.body.company || employee.company;
    employee.email = `${employee.firstname}.${employee.lastname[0]}@${employee.company.name}.com.au`;
    await employee.save();
    return res.status(200).send();
  } catch (e) {
    return res.status(500).send(e.message);
  }

});

//Delete an employee.
router.delete('/:id', async (req, res) => {
  await dbConnect();
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee) await Employee.remove(employee);
    return res.status(200).send();
  } catch (e) {
    return res.status(500).send(e.message);
  }

});
module.exports = router;
