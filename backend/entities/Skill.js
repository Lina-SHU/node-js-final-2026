const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Skill',
    tableName: 'skills',
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
            nullable: true,
            unique: true
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
})