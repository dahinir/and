var customers = [
{favoriteMovie: 'Customer A', age: 21},
{favoriteMovie: 'Customer B', age: 22},
{favoriteMovie: 'Customer C', age: 23},
{favoriteMovie: 'Customer D', age: 24},
{favoriteMovie: 'Customer E', age: 25}
];

module.exports = function(server) {
  console.log("sample data");
  var dataSource = server.dataSources.db;
  dataSource.automigrate('Customer', function(er) {
    if (er) throw er;
    var Model = server.models.Customer;
    //create sample data
    var count = customers.length;
    customers.forEach(function(customer) {
      console.log("asdf");
      Model.create(customer, function(er, result) {
        if (er) return;
        console.log('Record created:', result);
        count--;
        if (count === 0) {
          console.log('done');
          dataSource.disconnect();
        }
      });
    });
    //define a custom scope
    Model.scope('youngFolks', {where: {age: {lte: 22 }}});
  });
};
