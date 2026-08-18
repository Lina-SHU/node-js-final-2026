const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
            nullable: false
        },
        name: {
            type: 'varchar',
            length: 50,
            nullable: false,
        },
        email: {
            type: 'varchar',
            length: 320,
            nullable: false,
            unique: true
        },
        password: {
            type: 'varchar',
            length: 255,
            nullable: true
        },
        role: {
            type: 'varchar',
            length: 20,
            nullable: true,
            default: 'USER'
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
            nullable: false
        }
    }
});