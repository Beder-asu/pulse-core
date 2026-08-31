const inventoryRepository = require('../repositories/inventoryRepository');
const pharmacyAccessPolicy = require('../policies/pharmacyAccessPolicy');

const createInventoryService = ({ inventory, access }) => ({
  getInventory: (requester) => {
    access.assertCanViewInventory(requester);
    return inventory.findAll();
  }
});

module.exports = createInventoryService({ inventory: inventoryRepository, access: pharmacyAccessPolicy });
module.exports.createInventoryService = createInventoryService;
