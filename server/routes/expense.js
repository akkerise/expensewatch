let mongoose = require('mongoose');
let Expense = require('../models/expense');
let config = require('../config');

exports.saveExpense = function (req, res, next) {
  const uid = req.params.id;
  const dt = req.body.expdate;
  const typ = req.body.expaccout;
  const amt = req.body.expamt;
  const desc = req.body.expdesc;
  const expid = req.body.expid;

  if (!uid || !dt || !typ || !amt) {
    return res.status(422).json({success: false, message: 'Posted data is not correct or incomplete.'});
  } else {

    if (expid) {
      // Edit expense
      Expense.findById(expid).exec(function (err, expense) {
        if (err) {
          return res.status(400).json({success: false, message: 'Error processing request ' + err})
        }

        if (expense) {
          expense.expenseDate = dt;
          expense.expenseType = typ;
          expense.expenseAmt = amt;
          expense.expenseDESC = desc;
        }

        expense.save(function (err) {
          if (err) {
            return res.status(400).json({success: false, message: 'Error processing request ' + err})
          }

          return res.status(201).json({
            success: true,
            message: 'Expense updated successfully.'
          })
        })
      })


    } else {
      // Add new expense
      let newExpense = new Expense({
        userid: uid,
        expenseDate: dt,
        expenseType: typ,
        expenseAmt: amt,
        expenseDESC: desc
      })

      newExpense.save(function (err) {
        if (err) {
          return res.status(400).json({success: false, message: 'Error processing request ' + err})
        }

        return res.status(201).json({
          success: true,
          message: 'Expense saved successfully'
        })
      })
    }
  }
}


exports.delExpense = function (req, res, next) {
  Expense.remove({_id: req.params.id}, function (err) {
    if (err) {
      return res.status(400).json({success: false, message: 'Error processing request ' + err})
    }

    return res.status(201).json({success: true, message: 'Deleted expense have id : ' + req.params.id})
  })
}


exports.getExpense = function (req, res, next) {
  Expense.find({_id: req.params.id}, function (err, expense) {
    if (err) {
      return res.status(400).json({success: false, message: 'Error processing request ' + err})
    }

    return res.status(201).json({success: true, data: expense})
  })
}


exports.totalExpense = function (req, res, next) {
  const uid = req.params.id || req.param('uname');
  const rptype = req.body.report || req.param('report');
  const from_dt = req.body.startdt || req.param('startdt');
  const to_dt = req.body.enddt || req.param('enddt');
  const fromtdt = new Date(from_dt);
  const todt = new Date(to_dt);

  let match = {};

  if (rptype === 'opt1') {
    let oDt = new Date();
    let month = oDt.getUTCMonth() + 1; // months from 1-12
    let year = oDt.getFullYear();

    let fdt = new Date(year + '/' + month + '/1');
    let tdt = new Date(year + '/' + month + '/31');

    match = {'$match': {userid: uid, expenseDate: {$gte: fdt, $lte: tdt}}};

  } else if (rptype === 'opt2') {
    match = {'$match': {userid: uid, expenseDate: {$gte: fromtdt, $lte: todt}}};
  } else {
    match = {'$match': {userid: uid}};
  }

  Expense.aggregate([
    match,
    {
      '$group': {
        "_id": 1,
        "total": {"$sum": '$expenseAmt'}
      }
    }],
    function (err, result) {
      if (err) {
        return res.status(400).json({success: false, message: 'Error processing request ' + err})
      }
      return res.status(201).json({
        success: true,
        data: result
      })
    })
}

exports.reportExpense = function (req, res, next) {
  const uid = req.params.id || req.query.uname;
  const rptype = req.body.report || req.query.report;
  const fromtdt = req.body.startdt || req.query.startdt;
  const to_dt = req.body.enddt || req.query.enddt;
  const fromdt = new Date(from_dt);
  const todt = new Date(to_dt);

  let limit = parseInt(req.query.limit);
  let page = parseInt(req.body.page || req.query.page);
  let sortby = req.body.sortby || req.query.sortby;

  let query = {};

  if (!limit || limit < 1) {
    limit = 10;
  }


  if (!page || page < 1) {
    page = 1;
  }

  if (!sortby) {
    sortby = 'expenseDate';
  }

  var offset = (page - 1) * limit;


  if (!uid || !rptype) {
    return res.status(422).send({err: 'Posted data is not correct or incomplete.'})
  } else if (rptype === 'opt2' && !fromdt && !todt) {
    return res.status(422).send({error: 'From or To date missing.'})
  } else if (fromdt > todt) {
    return res.status(422).send({error: 'From date cannot be greater than to date'})
  } else {
    if (rptype === 'opt1') {
      // return records for the current month
      let oDt = new Date();
      let month = oDt.getUTCMonth() + 1; // months from 1->12
      let year = oDt.getUTCFullYear();

      let fdt = new Date(year + '/' + month + '/1');
      let tdt = new Date(year + '/' + month + '/31');

      query = {userid: uid, expenseDate: {$gte: fdt, $lte: tdt}};

      Expense.count(query, function (err, count) {
        if (count > offset) {
          offset = 0
        }
      });
    } else if (rptype === 'opt2') {
      // return records within given date range
      query = {userid: uid, expenseDate: {$gte: fromdt, $lte: todt}};

      Expense.count(query, function (err, count) {
        if (count > offset) {
          offset = 0
        }
      })
    }

    var options = {
      select: 'expenseDate expenseType expenseAmt expenseDESC',
      sort: sortby,
      offset: offset,
      limit: limit
    }

    Expense.paginate(query, options).then(function (result) {
      res.status(201).json({
        success: true,
        data: result
      })
    })
  }
}
