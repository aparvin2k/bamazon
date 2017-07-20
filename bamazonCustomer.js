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

        type: "confirm",
        name: "confirm",
        message: "Welcome to Bamazon! Would you like to view our inventory?",
        default: true

    }]).then(function(user) {
        if (user.confirm === true) {
            inventory();
        } else {
            console.log("Thank you! Come back soon!");
            connection.end();
        }
    });
}

//=================================Inventory===============================

function inventory() {

    // instantiate the cli-table npm package
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
            continueQ();
        });
    }
}

//=================================Inquirer user purchase===============================

function continueQ() {

    inquirer.prompt([{

        type: "confirm",
        name: "continue",
        message: "Would you like to purchase an item?",
        default: true

    }]).then(function(user) {
        if (user.continue === true) {
            selectionQ();
        } else {
            console.log("Thank you! Come back soon!");
            connection.end();
        }
    });
}

//=================================Item selection and Quantity desired===============================

function selectionQ() {

    inquirer.prompt([{

            type: "input",
            name: "id",
            message: "Please enter the ID number of the item you would like to purchase.",
            validate: function(value) {
          			if (isNaN(value) === false) {
            			return true;
          				}
          				console.log("\nPlease enter a valid number");
          				return false;
        			}
        },
        {
            type: "input",
            name: "number",
            message: "How many units of this item would you like to purchase?",
            validate: function(value) {
          			if (isNaN(value) === false) {
            			return true;
          				}
          				console.log("\nPlease enter a valid number");
          				return false;
        			}

        }
    ]).then(function(userPurchase) {

        //connect to database to find stock_quantity in database. If user quantity input is greater than stock, decline purchase.

        connection.query("SELECT * FROM products WHERE item_id=?", userPurchase.id, function(err, res) {


            for (var i = 0; i < res.length; i++) {

            	if (userPurchase.number > res[i].stock_quantity) {

                	var content = ("===================================================" + 
                					"\nSorry! Not enough in stock. Please try again later." + 
                					"\n===================================================");
                    console.log(content);
                    start();

                } else {
                    //list item information for user for confirm prompt
                    var message = ("===================================" + "\nAwesome! We can fulfull your order." + 
                    			"\n===================================" + "\nYou've selected:" + "\n----------------" +
                    			"\nItem: " + res[i].product_name + "\nDepartment: " + res[i].department_name +
                    			"\nPrice: " + res[i].price + "\nQuantity: " + userPurchase.number + "\n----------------" +
                    			"\nTotal: $" + res[i].price * userPurchase.number + "\n===================================");

                    console.log(message);

                    var newStock = (res[i].stock_quantity - userPurchase.number);
                    var purchaseId = (userPurchase.id);
                    //console.log(newStock);
                    confirm(newStock, purchaseId);
                }
            }
        });
    });
}

//=================================Confirm Purchase===============================

function confirm(newStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Are you sure you would like to purchase this item and quantity?",
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

            var content = ("=================================" + "\nTransaction completed. Thank you." +
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

