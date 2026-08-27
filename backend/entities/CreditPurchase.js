const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CreditPurchase',
    tableName: 'credit_purchases',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
            nullable: false
        },
        user_id: {
            type: 'uuid',
            nullable: false
        },
        credit_package_id: {
            type: 'uuid',
            nullable: false
        },
        purchased_credits: {
            type: 'integer',
            nullable: false,
            default: 0
        },
        price_paid: {
            type: 'integer',
            nullable: false,
            default: 0
        },
        purchase_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false
        }
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'user_id'
            }
        },
        credit_package: {
            type: 'many-to-one',
            target: 'CreditPackage',
            joinColumn: {
                name: 'credit_package_id'
            }
        }
    }
})