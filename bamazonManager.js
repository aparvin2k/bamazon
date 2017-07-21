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
    password: "password",
    database: "bamazonDB"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    start();
});

var count = 0;

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
            count = res.length;
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
            count = res.length;
            start();
        });
    }
}

//=================================Add Inventory===============================

function addInventory() {

    inquirer.prompt([{

            type: "input",
            name: "id",
            message: "Please enter the ID number of the item you would like to purchase.",
            validate: function(value) {
                    if (value <= 0 || value > count) {
                        return "Please input a valid id";
                    } else if (isNaN(value)) {
                        return "Please input the item's id";
                    } else if (!isInt(value)) {
                        return "Please input a valid integer";
                    }
                    return true;
                }
        },
        {
            type: "input",
            name: "number",
            message: "How many units of this item would you like to purchase?",
            validate: function(value) {
                    if (value < 0) {
                        return "Please input a positive number";
                    } else if (isNaN(value)) {
                        return "Please input a valid amount";
                    } else if (!isInt(value)) {
                        return "Please input a valid integer";
                    }
                    return true;
                    }
        }
    ]).then(function(managerAdd) {

        //connect to database to find stock_quantity in database. If user quantity input is greater than stock, decline purchase.

        connection.query("SELECT * FROM products WHERE item_id=?", managerAdd.id, function(err, res) {

                    var newStock = (res[0].stock_quantity + parseInt(managerAdd.number));
                    var purchaseId = (managerAdd.id);
                    //console.log(newStock);
                    confirm(newStock, purchaseId);           
        });
    });
}

//=================================Confirm Inventory===============================

function confirm(newStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Are you sure you would like to increase this items stock?",
        default: true

    }]).then(function(userConfirm) {
        if (userConfirm.confirm === true) {

            //if user confirms purchase, update mysql database with new stock quantity by subtracting user quantity purchased.

            connection.query("UPDATE products SET ? WHERE ?", [
            {
                stock_quantity: newStock
            }, 
            {
                item_id: purchaseId
            }], 
            function(err, res) {});

            var content = ("=================================" + "\nStock quantity added to inventory. Thank you." +
                        "\n=================================");
            console.log(content);
            start();
        } else {

            var message = ("=================================" + "\nNo worries. Maybe next time!" +
                        "\n=================================");
            console.log(message);
            start();
        }
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
                    if (value < 0) {
                        return "Please input a positive price";
                    } else if (isNaN(value)) {
                        return "Please input a valid amount";
                    } 
                    return true;
                    }
        },
        {
            type: "input",
            name: "stock",
            message: "Please enter the stock quantity of the new product.",
            validate: function(value) {
                    if (value < 0) {
                        return "Please input a positive number";
                    } else if (isNaN(value)) {
                        return "Please input a valid amount";
                    } else if (!isInt(value)) {
                        return "Please input a valid integer";
                    }
                    return true;
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

//========================Check if Value is an integer========================

function isInt(value) {
  var x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}

//=================================Exit Program===============================

function exit() {
    connection.end();
}