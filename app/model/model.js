import {sequelize} from "../../infrastructure/database/mysql.js";
import {DataTypes} from "sequelize";

export const Branch = sequelize.define('branches', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    open_time: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    close_time: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    contact: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'branches',
});


export const Employee = sequelize.define("employees", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    role: {
        type: DataTypes.ENUM('owner', 'kitchen', 'warehouse'),
        allowNull: true,
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    }

}, {
    timestamps: true,
    tableName: 'employees',
});

export const EmployeeShift = sequelize.define('employee_shifts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    start: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'employee_shifts',
});

export const KitchenShift = sequelize.define('kitchen_shifts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    start: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'kitchen_shifts',
});

export const Category = sequelize.define("categories", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'categories',
})

export const Menu = sequelize.define("menus", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    price: {
        type: DataTypes.BIGINT,
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'menus',
})

export const KitchenShiftDetail = sequelize.define("kitchen_shift_details", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_kitchen_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kitchen_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'menus',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    initial_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    end_stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: 'kitchen_shift_details',
})

// TODO: add cashier shift id here
export const Order = sequelize.define("orders", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    ordered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date(),
    },
    fk_kitchen_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kitchen_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
        default: "Pending"
    },
    table_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    is_take_away: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'orders',
})

export const OrderItem = sequelize.define("order_items", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    fk_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'menus',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    note: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: true,
        default: 'Pending'
    }
}, {
    timestamps: true,
    tableName: 'order_items',
})

// TODO: add cashier shift id
export const OrderPayment = sequelize.define("order_payments", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    fk_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    method: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
        default: "Pending"
    }
}, {
    timestamps: true,
    tableName: 'order_payments',
})

export const CashierShift = sequelize.define('cashier_shifts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    start: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    initial_cash: {
        type: DataTypes.BIGINT,
        alowNull: false,
    },
    final_cash: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'cashier_shifts',
})

export const CashierShiftCashIn = sequelize.define('cashier_shift_cash_ins', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_cashier_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cashier_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    subject: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'cashier_shift_cash_ins',
});

export const CashierShiftCashOut = sequelize.define('cashier_shift_cash_outs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_cashier_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cashier_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    subject: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    unit: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    unit_price: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'cashier_shift_cash_outs',
});

// warehouse_shifts
export const WarehouseShift = sequelize.define('warehouse_shifts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    start: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'warehouse_shifts',
});

// inventory_item_categories
export const InventoryItemCategory = sequelize.define('inventory_item_categories', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'inventory_item_categories',
});

// inventory_items
export const InventoryItem = sequelize.define('inventory_items', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_inventory_item_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inventory_item_categories',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    unit: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    purchase_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    threshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    expired_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    is_new: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: true
    },
}, {
    timestamps: true,
    tableName: 'inventory_items',
});

// stock_requests
export const StockRequest = sequelize.define('stock_requests', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_kitchen_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kitchen_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_warehouse_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'warehouse_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Pending',
    },
    note: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'stock_requests',
});

// stock_requests_item
export const StockRequestItem = sequelize.define('stock_requests_item', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_stock_request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'stock_requests',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_inventory_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inventory_items',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Pending',
    },
}, {
    timestamps: true,
    tableName: 'stock_requests_item',
});

// stock_movements
export const StockMovement = sequelize.define('stock_movements', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_warehouse_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'warehouse_shifts',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_inventory_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inventory_items',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
    tableName: 'stock_movements',
});

// Model Relation
EmployeeShift.belongsTo(Employee, {foreignKey: 'fk_employee_id'});
EmployeeShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'});

KitchenShift.belongsTo(Employee, {foreignKey: 'fk_employee_id'});
KitchenShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
KitchenShift.hasMany(KitchenShiftDetail, {foreignKey: 'fk_kitchen_shift_id'});
KitchenShift.hasMany(Order, {foreignKey: 'fk_kitchen_shift_id'});

Category.hasMany(Menu, {foreignKey: 'fk_category_id'});

Menu.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
Menu.belongsTo(Category, {foreignKey: 'fk_category_id'});
Menu.hasMany(KitchenShiftDetail, {foreignKey: 'fk_menu_id'});
Menu.hasMany(OrderItem, {foreignKey: 'fk_menu_id'});

KitchenShiftDetail.belongsTo(KitchenShift, {foreignKey: 'fk_kitchen_shift_id'});
KitchenShiftDetail.belongsTo(Menu, {foreignKey: 'fk_menu_id'});

Employee.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
Employee.hasMany(EmployeeShift, {foreignKey: 'fk_employee_id'});
Employee.hasMany(KitchenShift, {foreignKey: 'fk_employee_id'});

Branch.hasMany(Employee, {foreignKey: 'fk_branch_id'});
Branch.hasMany(EmployeeShift, {foreignKey: 'fk_branch_id'});
Branch.hasMany(KitchenShift, {foreignKey: 'fk_branch_id'});
Branch.hasMany(Menu, {foreignKey: 'fk_branch_id'});
Branch.hasMany(Order, {foreignKey: 'fk_branch_id'});

Order.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
Order.belongsTo(KitchenShift, {foreignKey: 'fk_kitchen_shift_id'});
Order.hasMany(OrderItem, {foreignKey: 'fk_order_id'})
Order.hasMany(OrderPayment, {foreignKey: 'fk_order_id'})

OrderItem.belongsTo(Order, {foreignKey: 'fk_order_id'})
OrderItem.belongsTo(Menu, {foreignKey: 'fk_menu_id'})

OrderPayment.belongsTo(Order, {foreignKey: "fk_order_id"});

CashierShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'})
CashierShift.hasMany(CashierShiftCashIn, {foreignKey: 'fk_cashier_shift_id'});
CashierShift.hasMany(CashierShiftCashOut, {foreignKey: 'fk_cashier_shift_id'});

CashierShiftCashIn.belongsTo(CashierShift, {foreignKey: 'fk_cashier_shift_id'});
CashierShiftCashOut.belongsTo(CashierShift, {foreignKey: 'fk_cashier_shift_id'});

WarehouseShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
WarehouseShift.hasMany(StockRequest, {foreignKey: 'fk_warehouse_shift_id'});
WarehouseShift.hasMany(StockMovement, {foreignKey: 'fk_warehouse_shift_id'});

InventoryItemCategory.hasMany(InventoryItem, {foreignKey: 'fk_inventory_item_category_id'});

InventoryItem.belongsTo(InventoryItemCategory, {foreignKey: 'fk_inventory_item_category_id'});
InventoryItem.hasMany(StockRequestItem, {foreignKey: 'fk_inventory_item_id'});
InventoryItem.hasMany(StockMovement, {foreignKey: 'fk_inventory_item_id'});

StockRequest.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
StockRequest.belongsTo(KitchenShift, {foreignKey: 'fk_kitchen_shift_id'});
StockRequest.belongsTo(WarehouseShift, {foreignKey: 'fk_warehouse_shift_id'});
StockRequest.hasMany(StockRequestItem, {foreignKey: 'fk_stock_request_id'});

StockRequestItem.belongsTo(StockRequest, {foreignKey: 'fk_stock_request_id'});
StockRequestItem.belongsTo(InventoryItem, {foreignKey: 'fk_inventory_item_id'});

StockMovement.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
StockMovement.belongsTo(WarehouseShift, {foreignKey: 'fk_warehouse_shift_id'});
StockMovement.belongsTo(InventoryItem, {foreignKey: 'fk_inventory_item_id'});
