import {getSequelize} from "../../infrastructure/database/mysql.js";
import {DataTypes} from "sequelize";

const sequelize = await getSequelize();

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

export const User = sequelize.define("users", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('employee', 'customer'),
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'users',
});


export const Employee = sequelize.define("employees", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    uid: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
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
        type: DataTypes.ENUM('admin', 'pemilik', 'bendahara', 'gudang', 'dapur', 'kasir'),
        allowNull: true,
    },
    fk_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

export const Customer = sequelize.define("customers", {
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
    phone: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
    },
    fk_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
})


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
        onDelete: 'CASCADE',
    },
    fk_branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
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
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM('inv', 'menu'),
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
    description: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    threshold: {
        type: DataTypes.INTEGER,
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

export const Order = sequelize.define("orders", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
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
    fk_cashier_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cashier_shifts',
            key: 'id',
        },
    },
    fk_customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'customers',
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
        allowNull: true,
    },
    is_take_away: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
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
        type: DataTypes.UUID,
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
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    }
}, {
    timestamps: true,
    tableName: 'order_items',
})

export const RefundItem = sequelize.define("refund_items", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    fk_order_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'order_items',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    reason: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    method: {
        type: DataTypes.STRING(200),
        allowNull: true,
        default: 'Pending'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
}, {
    timestamps: true,
    tableName: 'refund_items',
})

export const OrderPayment = sequelize.define("order_payments", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    fk_order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    fk_cashier_shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cashier_shifts',
            key: 'id',
        },
    },
    method: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
        default: "Pending"
    },
    snap_token: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
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
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
}, {
    timestamps: true,
    tableName: 'warehouse_shifts',
});

// inventory_items
export const InventoryItem = sequelize.define('inventory_items', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
        defaultValue: 0
    },
    expired_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_new: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
}, {
    timestamps: true,
    tableName: 'stock_movements',
});

export const FundRequest = sequelize.define('fund_requests', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    subject: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(1000),
        allowNull: true,
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
    approval_notes: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
}, {
    timestamps: true,
    tableName: 'fund_requests',
})

export const FundRequestItem = sequelize.define('fund_requests_item', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fk_fund_request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'fund_requests',
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
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
}, {
    timestamps: true,
    tableName: 'fund_requests_item',
});

export const Reservation = sequelize.define('reservations', {
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
    fk_customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'customers',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: 'Pending',
    },
    people: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    notes: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    }
}, {
    timestamps: true,
    tableName: 'reservations',
})

// Model Relation
EmployeeShift.belongsTo(Employee, {foreignKey: 'fk_employee_id'});
EmployeeShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
EmployeeShift.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
EmployeeShift.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

KitchenShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
KitchenShift.hasMany(KitchenShiftDetail, {foreignKey: 'fk_kitchen_shift_id', as: "details"});
KitchenShift.hasMany(StockRequest, {foreignKey: 'fk_kitchen_shift_id', as: "stockRequests"});
KitchenShift.hasMany(Order, {foreignKey: 'fk_kitchen_shift_id'});
KitchenShift.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
KitchenShift.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

Category.hasMany(Menu, {foreignKey: 'fk_category_id'});

Menu.belongsTo(Branch, {foreignKey: 'fk_branch_id', as: "branch"});
Menu.belongsTo(Category, {foreignKey: 'fk_category_id', as: "category"});
Menu.hasMany(KitchenShiftDetail, {foreignKey: 'fk_menu_id'});
Menu.hasMany(OrderItem, {foreignKey: 'fk_menu_id'});

KitchenShiftDetail.belongsTo(KitchenShift, {foreignKey: 'fk_kitchen_shift_id'});
KitchenShiftDetail.belongsTo(Menu, {foreignKey: 'fk_menu_id'});

Employee.belongsTo(User, {foreignKey: 'fk_user_id', as: 'user'});
Employee.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
Employee.hasMany(EmployeeShift, {foreignKey: 'fk_employee_id'});

Branch.hasMany(Employee, {foreignKey: 'fk_branch_id'});
Branch.hasMany(EmployeeShift, {foreignKey: 'fk_branch_id'});
Branch.hasMany(KitchenShift, {foreignKey: 'fk_branch_id'});
Branch.hasMany(Menu, {foreignKey: 'fk_branch_id'});
Branch.hasMany(Order, {foreignKey: 'fk_branch_id'});

User.hasOne(Employee, {foreignKey: 'fk_user_id', as: 'employee'});
User.hasOne(Customer, {foreignKey: 'fk_user_id', as: 'customer'});

Customer.belongsTo(User, {foreignKey: 'fk_user_id', as: 'user'});
Customer.hasMany(Order, {foreignKey: 'fk_customer_id'});

Order.belongsTo(User, {foreignKey: 'created_by', as: "createdBy"});
Order.belongsTo(User, {foreignKey: 'updated_by', as: "updatedBy"});
Order.belongsTo(Branch, {foreignKey: 'fk_branch_id', as: 'branch'});
Order.belongsTo(KitchenShift, {foreignKey: 'fk_kitchen_shift_id'});
Order.belongsTo(CashierShift, {foreignKey: 'fk_cashier_shift_id'});
Order.belongsTo(Customer, {foreignKey: 'fk_customer_id', as: 'customer'});
Order.hasMany(OrderItem, {foreignKey: 'fk_order_id', as: 'items'})
Order.hasOne(OrderPayment, {foreignKey: 'fk_order_id', as: 'payment'})

OrderItem.belongsTo(Order, {foreignKey: 'fk_order_id'})
OrderItem.belongsTo(Menu, {foreignKey: 'fk_menu_id'})
OrderItem.belongsTo(User, {foreignKey: 'created_by'})
OrderItem.belongsTo(User, {foreignKey: 'updated_by'})

OrderPayment.belongsTo(Order, {foreignKey: "fk_order_id"});
OrderPayment.belongsTo(Employee, {foreignKey: "created_by"});
OrderPayment.belongsTo(Employee, {foreignKey: "updated_by"});
OrderPayment.belongsTo(Order, {foreignKey: "fk_order_id"});
OrderPayment.belongsTo(CashierShift, {foreignKey: "fk_cashier_shift_id"});

RefundItem.belongsTo(OrderItem, {foreignKey: 'fk_order_item_id', as: 'orderItem'});
// RefundItem.belongsTo(InventoryItem, {foreignKey: 'fk_inventory_item_id', as: 'inventoryItem'});
RefundItem.belongsTo(Employee, {foreignKey: 'created_by', as: 'createdBy'});
RefundItem.belongsTo(Employee, {foreignKey: 'updated_by', as: 'updatedBy'});

CashierShift.belongsTo(Branch, {foreignKey: 'fk_branch_id'})
CashierShift.hasMany(Order, {foreignKey: 'fk_cashier_shift_id'});
CashierShift.hasMany(OrderPayment, {foreignKey: 'fk_cashier_shift_id'});
CashierShift.hasMany(CashierShiftCashIn, {foreignKey: 'fk_cashier_shift_id'});
CashierShift.hasMany(CashierShiftCashOut, {foreignKey: 'fk_cashier_shift_id'});
CashierShift.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
CashierShift.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

CashierShiftCashIn.belongsTo(CashierShift, {foreignKey: 'fk_cashier_shift_id'});
CashierShiftCashIn.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
CashierShiftCashIn.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});
CashierShiftCashOut.belongsTo(CashierShift, {foreignKey: 'fk_cashier_shift_id'});
CashierShiftCashOut.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
CashierShiftCashOut.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

WarehouseShift.hasMany(StockRequest, {foreignKey: 'fk_warehouse_shift_id', as: "stockRequests"});
WarehouseShift.hasMany(StockMovement, {foreignKey: 'fk_warehouse_shift_id', as: "stockMovements"});
WarehouseShift.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
WarehouseShift.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

InventoryItem.belongsTo(Category, {foreignKey: 'fk_category_id', as: 'category'});
InventoryItem.hasMany(StockRequestItem, {foreignKey: 'fk_inventory_item_id'});
InventoryItem.hasMany(StockMovement, {foreignKey: 'fk_inventory_item_id'});
InventoryItem.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
InventoryItem.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

StockRequest.belongsTo(Branch, {foreignKey: 'fk_branch_id'});
StockRequest.belongsTo(KitchenShift, {foreignKey: 'fk_kitchen_shift_id', as: 'kitchenShift'});
StockRequest.belongsTo(WarehouseShift, {foreignKey: 'fk_warehouse_shift_id', as: "warehouseShift"});
StockRequest.hasMany(StockRequestItem, {foreignKey: 'fk_stock_request_id', as: 'items'});
StockRequest.belongsTo(Employee, {foreignKey: 'created_by', as: "createdBy"});
StockRequest.belongsTo(Employee, {foreignKey: 'updated_by', as: "updatedBy"});

StockRequestItem.belongsTo(Employee, {foreignKey: 'created_by', as: "createdBy"});
StockRequestItem.belongsTo(Employee, {foreignKey: 'updated_by', as: "updatedBy"});
StockRequestItem.belongsTo(StockRequest, {foreignKey: 'fk_stock_request_id'});
StockRequestItem.belongsTo(InventoryItem, {foreignKey: 'fk_inventory_item_id', as: 'inventoryItem'});

StockMovement.belongsTo(Branch, {foreignKey: 'fk_branch_id', as: 'branch'});
StockMovement.belongsTo(WarehouseShift, {foreignKey: 'fk_warehouse_shift_id', as: 'warehouseShift'});
StockMovement.belongsTo(InventoryItem, {foreignKey: 'fk_inventory_item_id', as: 'inventoryItem'});
StockMovement.belongsTo(Employee, {foreignKey: "created_by", as: "createdBy"});
StockMovement.belongsTo(Employee, {foreignKey: "updated_by", as: "updatedBy"});

FundRequest.belongsTo(WarehouseShift, {foreignKey: 'fk_warehouse_shift_id', as: 'warehouseShift'});
FundRequest.belongsTo(Employee, {foreignKey: 'created_by', as: "createdBy"});
FundRequest.belongsTo(Employee, {foreignKey: 'updated_by', as: "updatedBy"});
FundRequest.hasMany(FundRequestItem, {foreignKey: 'fk_fund_request_id', as: 'items'});

FundRequestItem.belongsTo(Employee, {foreignKey: 'created_by', as: "createdBy"});
FundRequestItem.belongsTo(Employee, {foreignKey: 'updated_by', as: "updatedBy"});
FundRequestItem.belongsTo(FundRequest, {foreignKey: 'fk_fund_request_id'});
FundRequestItem.belongsTo(InventoryItem, {foreignKey: 'fk_inventory_item_id', as: 'inventoryItem'});

Reservation.belongsTo(Branch, {foreignKey: 'fk_branch_id', as: "branch"});
Reservation.belongsTo(Customer, {foreignKey: 'fk_customer_id', as: "customer"});
Reservation.belongsTo(User, {foreignKey: 'created_by', as: "createdBy"});
Reservation.belongsTo(User, {foreignKey: 'updated_by', as: "updatedBy"});