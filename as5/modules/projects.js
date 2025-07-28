import dotenv from 'dotenv';
dotenv.config();

import { Sequelize, DataTypes, Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    }
  },
  logging: false,
});

const Sector = sequelize.define('Sector', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sector_name: DataTypes.STRING,
}, {
  timestamps: false,
});

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: DataTypes.STRING,
  feature_img_url: DataTypes.STRING,
  summary_short: DataTypes.TEXT,
  intro_short: DataTypes.TEXT,
  impact: DataTypes.TEXT,
  original_source_url: DataTypes.STRING,
  sector_id: DataTypes.INTEGER,
}, {
  timestamps: false,
});

Project.belongsTo(Sector, { foreignKey: 'sector_id' });

export function initialize() {
  return sequelize.sync();
}

export function getAllProjects() {
  return Project.findAll({ include: [Sector] });
}

export function getProjectById(id) {
  return Project.findOne({ include: [Sector], where: { id } })
    .then(project => {
      if (!project) throw new Error('Unable to find requested project');
      return project;
    });
}

export function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: {
      '$Sector.sector_name$': { [Op.iLike]: `%${sector}%` }
    }
  }).then(projects => {
    if (projects.length === 0) throw new Error('Unable to find requested projects');
    return projects;
  });
}

export function getAllSectors() {
  return Sector.findAll();
}

export function addProject(projectData) {
  return Project.create(projectData)
    .catch(err => { throw new Error(err.errors?.[0]?.message || err.message); });
}

export function editProject(id, projectData) {
  return Project.update(projectData, { where: { id } })
    .then(([affectedRows]) => {
      if (affectedRows === 0) throw new Error('No project updated');
      return;
    })
    .catch(err => { throw new Error(err.errors?.[0]?.message || err.message); });
}

export function deleteProject(id) {
  return Project.destroy({ where: { id } })
    .then(deleted => {
      if (!deleted) throw new Error('No project deleted');
      return;
    })
    .catch(err => { throw new Error(err.errors?.[0]?.message || err.message); });
}


if (process.argv[2] === 'bulkInsert') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const runBulkInsert = async () => {
    try {
      const sectorDataRaw = await fs.readFile(path.join(__dirname, '../data/sectorData.json'), 'utf-8');
      const projectDataRaw = await fs.readFile(path.join(__dirname, '../data/projectData.json'), 'utf-8');
      const sectorData = JSON.parse(sectorDataRaw);
      const projectData = JSON.parse(projectDataRaw);

      await sequelize.sync({ force: true });
      await Sector.bulkCreate(sectorData);
      await Project.bulkCreate(projectData);

      await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Sectors"', 'id'), (SELECT MAX(id) FROM "Sectors"))`);
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Projects"', 'id'), (SELECT MAX(id) FROM "Projects"))`);

      console.log("-----");
      console.log("data inserted successfully");
    } catch (err) {
      console.log("-----");
      console.log(err.message);
    }
    process.exit();
  };
  runBulkInsert();
}
