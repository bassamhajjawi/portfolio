import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedYear = null; // null = no slice selected

let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Search across all project fields, case-insensitive
function filterBySearch(list) {
  return list.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// Apply BOTH filters, then redraw everything
function updatePage() {
  let searched = filterBySearch(projects);

  let shown = searched;
  if (selectedYear !== null) {
    shown = searched.filter((p) => p.year === selectedYear);
  }

  renderProjects(shown, projectsContainer, 'h2');
  projectsTitle.textContent = `${shown.length} Projects`;
  renderPieChart(searched);
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcData.forEach((d) => {
    let year = d.data.label;

    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(year))
      .attr('class', year === selectedYear ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        updatePage();
      });
  });

  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        updatePage();
      });
  });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  updatePage();
});

updatePage(); // first render on page load