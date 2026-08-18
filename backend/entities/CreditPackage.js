const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CreditPackage',
    tableName: 'creditPackage',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
            nullable: false
        },
        name: {
            type: 'varchar',
            length: 150,
            nullable: false
        },
        credit_amount: {
            type: 'integer',
            nullable: false
        },
        price: {
            type: 'integer',
            nullable: false
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false
        }
    }
});
