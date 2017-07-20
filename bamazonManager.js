//=================================Setup Required Variables===============================

var Table = require('cli-table');
var mysql = require('mysql');
var inquirer = require('inquirer');

//=================================Connect to SQL database===============================

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "aliyar01",
    database: "bamazonDB"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    start();
});

//=================================Inquirer introduction===============================

function start() {

    inquirer.prompt([{

        type: "list",
        name: "actions",
        message: "Welcome Manager. What would you like to review?",
        choices: ["View Products For Sale", "View Low Inventory", "Add To Inventory", "Add New Product", "Exit"]

    }]).then(function(user) {
        if (user.actions === "View Products For Sale") {
            viewInventory();
        } else if (user.actions === "View Low Inventory") {
            viewLowInventory();
        } else if (user.actions === "Add To Inventory") {
            addInventory();
        } else if (user.actions === "Add New Product") {
            addProduct();
        } else {
            exit();
        }
    });
}

//=================================View Inventory===============================

function viewInventory() {

    // instantiate
    var table = new Table({
        head: ['ID', 'Item', 'Department', 'Price', 'Stock'],
        colWidths: [10, 30, 15, 10, 10]
    });

    listInventory();

    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    function listInventory() {

        //Variable creation from DB connection

        connection.query("SELECT * FROM products", function(err, res) {
            for (var i = 0; i < res.length; i++) {

                var itemId = res[i].item_id,
                    productName = res[i].product_name,
                    departmentName = res[i].department_name,
                    price = res[i].price,
                    stockQuantity = res[i].stock_quantity;

                table.push(
                    [itemId, productName, departmentName, price, stockQuantity]
                );
            }
            var content =("\n" + "\n========================== Current Bamazon Inventory ===========================" + table.toString());
            console.log(content);
            start();
        });
    }
}

//=================================View Low Inventory===============================

//Connect to database to show any inventory with less than 5 in stock quantity

function viewLowInventory() {
    // instantiate
    var table = new Table({
        head: ['ID', 'Item', 'Department', 'Price', 'Stock'],
        colWidths: [10, 30, 15, 10, 10]
    });

    listLowInventory();

    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    function listLowInventory() {

        connection.query("SELECT * FROM products", function(err, res) {
            for (var i = 0; i < res.length; i++) {

                //check if any of the stock_quantity equals 5 or less

                if (res[i].stock_quantity < 10) {

                    var itemId = res[i].item_id,
                        productName = res[i].product_name,
                        departmentName = res[i].department_name,
                        price = res[i].price,
                        stockQuantity = res[i].stock_quantity;

                    table.push(
                        [itemId, productName, departmentName, price, stockQuantity]
                    );
                }
            }
            var content =("\n" + "\n========== Low Bamazon Inventory (Less than 10 items in Inventory) =============" + table.toString());
            console.log(content);
            start();
        });
    }
}

//=================================Add Inventory===============================

function addInventory() {

    inquirer.prompt([{

            type: "input",
            name: "id",
            message: "Please enter the ID number of the item you would like to add inventory to.",
            validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                        }
                        return false;
                    }
        },
        {
            type: "input",
            name: "number",
            message: "How many units of this item would you like to have in the in-store stock quantity?",
            validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                        }
                        return false;
                    }
        }
    ]).then(function(managerAdd) {
              connection.query("SELECT * FROM products", function(err, res) {
                var tableArr = [];
                for (var i = 0; i < res.length; i++) {

                var itemId = res[i].item_id,
                    productName = res[i].product_name,
                    departmentName = res[i].department_name,
                    price = res[i].price,
                    stockQuantity = res[i].stock_quantity;

                    tableArr.push(
                        [itemId, productName, departmentName, price, stockQuantity]
                    );
            }
        });

              connection.query("UPDATE products SET ? WHERE ?", [
              {

                  stock_quantity: managerAdd.number 
              }, 
              {
                  item_id: managerAdd.id
              }
              ], 
              function(err, res) {
                if (err) throw err;

              });
          start();
        });
      }


//=================================Add New Product===============================

function addProduct() {

//ask user to fill in all necessary information to fill columns in table

    inquirer.prompt([{

            type: "input",
            name: "name",
            message: "Please enter the item name of the new product.",
            validate: function(input) {
                if (!input) {
                    console.log("\nPlease enter a product");
                }
                else {
                    return true;
                }
            }
        },
        {
            type: "input",
            name: "department",
            message: "Please enter which department name of which the new product belongs.",
            validate: function(input) {
                if (!input) {
                    console.log("\nPlease enter a department");
                }
                else {
                    return true;
                }
            }
        },
        {
            type: "input",
            name: "price",
            message: "Please enter the price of the new product (0.00).",
            validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                        }
                        console.log("\nPlease enter a valid price");
                        return false;
                    }
        },
        {
            type: "input",
            name: "stock",
            message: "Please enter the stock quantity of the new product.",
            validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                        }
                        console.log("\nPlease enter a valid price");
                        return false;
                    }
        }

    ]).then(function(managerNew) {

      //connect to database, insert column data with input from user

      connection.query("INSERT INTO products SET ?", {
        product_name: managerNew.name,
        department_name: managerNew.department,
        price: managerNew.price,
        stock_quantity: managerNew.stock
      }, function(err, res) {
        if (err) throw err;
      });
      start();
    });
  }

//=================================Exit Program===============================

function exit() {
    connection.end();
}