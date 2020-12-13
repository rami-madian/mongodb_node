const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employee = require('../model/employee');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const path = require('path');
const moment = require('moment');


const dbConnect = async () => {
  await mongoose.connect('mongodb://localhost/Test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });
}

const exportData = async (data, res) => {
  let csv;
  const fields = ['firstname', 'lastname', 'age', 'email', 'company.name'];
  try {
    csv = json2csv(data, { fields });
    const filePath = path.join(__dirname, '..', 'exports', `${moment().unix()}.csv`);
    fs.writeFileSync(filePath, csv)
    return res.download(filePath);
  } catch (e) {
    return res.status(500).json({ e });
  }
}

router.get('/count', async (req, res) => {
  await dbConnect();
  const list = await Employee.find({});
  return res.json(list.length);
});



//Retrieve all employees.
router.get('/', async (req, res) => {
  await dbConnect();
  let list;
  const pageSize = 10;
  const page = Math.max(0, req.query ? req.query.page : 0);

  if (req.query && req.query.companysize) {
    list = await Employee.find({'company.size': req.query.companysize})
        .sort( { firstname: 'asc' } )
        .limit(pageSize).skip(page);
  } else if (req.query && req.query.location) {
    list = await Employee.find({'company.location': req.query.location})
        .sort( { firstname: 'asc' } )
        .limit(pageSize).skip(page);
  } else {
    list = await Employee.find({})
        .sort( { firstname: 'asc' } )
        .limit(pageSize).skip(page);
  }
  if (req.query && req.query.export) {
      return exportData(list, res);
  } else {
    return res.json(list);
  }
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
