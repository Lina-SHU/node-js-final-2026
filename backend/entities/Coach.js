const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Coach',
    tableName: 'coaches',
    columns: {
        id: {
            type: 'uuid',
            primary: true,
            generated: 'uuid',
            nullable: false
        },
        experience_years: {
            type: 'integer',
            nullable: false,
            default: 0
        },
        description: {
            type: 'text',
            nullable: false
        },
        profile_image_url: {
            type: 'varchar',
            length: 2048,
            nullable: false
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
    },
    relations: {
        user: {
            type: 'one-to-one',
            target: 'User',
            joinColum: {
                name: 'user_id'
            }
        }
    }
})