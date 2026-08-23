const { EntitySchema, JoinColumn } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Course',
    tableName: 'courses',
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
            nullable: false,
            unique: true
        },
        user_id: {
            type: 'uuid',
            nullable: false
        },
        skill_id: {
            type: 'uuid',
            nullable: false
        },
        start_at: {
            type: 'timestamp',
            nullable: false
        },
        end_at: {
            type: 'timestamp',
            nullable: false
        },
        max_participants: {
            type: 'integer',
            nullable: false,
            default: 0
        },
        meeting_url: {
            type: 'varchar',
            length: 255,
            nullable: false
        },
        description: {
            type: 'varchar',
            length: 255,
            nullable: true
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            nullable: false
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
            nullable: true
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
        skill: {
            type: 'many-to-one',
            target: 'Skill',
            joinColumn: {
                name: 'skill_id'
            }
        }
    }
})
