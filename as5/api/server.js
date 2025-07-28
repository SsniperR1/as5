/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: mohammed Taha Zniber Student ID: 149167231 Date: 7/27/2025
*
*  Published URL: ___________________________________________________________
*
********************************************************************************/

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as projects from '../modules/projects.js';  // adjust path if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // adjust if views folder location is different

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.redirect('/solutions/projects');
});

app.get('/solutions/projects', (req, res) => {
  projects.getAllProjects()
    .then(projectsData => res.render('projects', { projects: projectsData }))
    .catch(err => res.render('500', { message: err.message }));
});

app.get('/solutions/addProject', (req, res) => {
  projects.getAllSectors()
    .then(sectors => res.render('addProject', { sectors }))
    .catch(err => res.render('500', { message: err.message }));
});

app.post('/solutions/addProject', (req, res) => {
  projects.addProject(req.body)
    .then(() => res.redirect('/solutions/projects'))
    .catch(err => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.get('/solutions/editProject/:id', (req, res) => {
  Promise.all([
    projects.getProjectById(req.params.id),
    projects.getAllSectors()
  ])
    .then(([project, sectors]) => res.render('editProject', { project, sectors }))
    .catch(err => res.status(404).render('404', { message: err.message }));
});

app.post('/solutions/editProject', (req, res) => {
  projects.editProject(req.body.id, req.body)
    .then(() => res.redirect('/solutions/projects'))
    .catch(err => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.get('/solutions/deleteProject/:id', (req, res) => {
  projects.deleteProject(req.params.id)
    .then(() => res.redirect('/solutions/projects'))
    .catch(err => res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` }));
});

app.use((req, res) => {
  res.status(404).render('404', { message: "Page not found" });
});

let initialized = false;
const initPromise = projects.initialize().then(() => {
  initialized = true;
}).catch(err => {
  console.error("Unable to initialize projects module:", err);
});

export default async function handler(req, res) {
  if (!initialized) {
    try {
      await initPromise;
    } catch (err) {
      res.status(500).send("Server initialization failed");
      return;
    }
  }
  app(req, res);
}
