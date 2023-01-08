//just figuring out data structure
const numcols = 6;

// var sampleAssignment = {
//   name: 'reading quiz 1',
//   score: 45,
//   outOf: 50,
//   letterGrade: 'A-',
// };

// var sampleCategories = [
//   new Category("Timed Essays", 0.1),
//   new Category("Major Essays", 0.5),
//   new Category("Presentations and Projects", 0.2),
//   new Category("Homework and Quizzes", 0.1),
//   new Category("Participation", 0.1),
// ];

// let categories = sampleCategories;
let categories = [];
let assignments = []
let b = document.getElementById('t');

console.log("https://www.google.com/search?q=front+end+vs+back+end+meme&source=lnms&tbm=isch&sa=X&ved=2ahUKEwijztbP-8LmAhVCBs0KHTiJBsQQ_AUoAXoECAwQAw&biw=1440&bih=821#imgrc=RmAc_nZvbzpCyM:");

function drawTables(){
  for (l in categories){
    let table = createTable(categories[l]);
    let b = document.getElementById('t');
    b.appendChild(table);
    b.appendChild(document.createElement('br'));
    b.appendChild(document.createElement('br'));
  }
}

drawTables();

function createTable(category) {
  let table = document.createElement('table');
  table.setAttribute('id', category.id);
  table.setAttribute('class', 'category');

  var assignments = category.assignments;

  table.append(createHeaderRow(category));
  table.append(createTitleRow());

  var assignment;
  for (i in assignments){
    assignment = assignments[i];
    table.append(createRow(assignment, false));
  }
  table.append(createNewAssignmentButton(category.id));
  return table;
}

function createNewAssignmentButton(id) {
  let row = document.createElement('tr');
  let cell = document.createElement('td');
  cell.setAttribute('colspan', numcols);
  cell.innerHTML = '<button class="new greenbutton" onclick="newAssignment(\''+id+'\')"><b>&nbsp;&plus;&nbsp;New Assignment</b></button>';

  row.append(cell);

  return row;
}

function createHeaderRow(category) {
  let headerRow = document.createElement('tr');
  let headerCell = document.createElement('td');
  let classtext = 'header orange';
  if (category.isNew) classtext='header green';
  headerCell.setAttribute('class', classtext);
  headerCell.setAttribute('colspan', numcols);
  headerCell.appendChild(createTableHeader(category, category.weight));
  headerRow.append(headerCell);

  return headerRow;
}

function createTableHeader(category, weight){
  let maindiv = document.createElement("div");
  let maintable = document.createElement("table");
  let tr = document.createElement("tr");
  let catNameTd = document.createElement("td");
  let catNameP = document.createElement("p");
  let weightTd = document.createElement("td");
  let weightInput = document.createElement("input");
  let categoryScoreP = document.createElement("p");
  maintable.setAttribute("width", "100%");
  maintable.setAttribute("class", "headertable");
  catNameTd.setAttribute("style", "text-align:right;width:50%;");
  catNameP.innerHTML = category.name;
  weightTd.setAttribute("style", "text-align:left;width:50%;");
  weightInput.setAttribute("value", parseFloat(weight*100));
  weightInput.setAttribute("id", "wi"+category.id);
  weightInput.setAttribute("class", "inh");
  weightInput.setAttribute("type", "number");
  weightInput.setAttribute("onfocus", "this.select();");
  weightTd.addEventListener("change", function(){
    var v = $("#"+"wi"+category.id).val();
    var cid = category.id;
    getCategoryById(cid).weight = v/100;
    updateGrade();
  })
  weightTd.appendChild(weightInput);
  weightTd.innerHTML += "%";
  catNameTd.appendChild(catNameP);

  categoryScoreP.setAttribute("class", "catscore");
  categoryScoreP.setAttribute("id", "score"+category.id);
  categoryScoreP.setAttribute("title", "Your score in this category (sum of all scores)/(sum of all Out Of). Anything above this percent in this category will make your grade go up");
  tr.appendChild(catNameTd);
  tr.appendChild(weightTd);
  maintable.appendChild(tr);
  maindiv.appendChild(maintable);
  maindiv.setAttribute("class", "maindiv");
  maindiv.appendChild(categoryScoreP);

  return maindiv;
}

function createTitleRow(){
  let row = document.createElement('tr');
  row.setAttribute('class', 'titleRow');
  row.appendChild(document.createElement('td'));
  row.appendChild(createCell('Name', false));
  row.appendChild(createCell('Score', false));
  row.appendChild(createCell('Out Of', false));
  row.appendChild(createCell('Percent', false));
  row.appendChild(createCell("&nbsp;", false));

  return row;
}

function createRow(assignment, isMock) {
  let row = document.createElement('tr');
  if (!isNaN(assignment.score/assignment.outOf)){
    assignment.percent = (((assignment.score/assignment.outOf) * 100)).toFixed(2).toString() + '%';
  } else {
    assignment.percent = '';
  }
  if (isMock) {
    row.innerHTML += '<td class="green">&nbsp;</td>';
  } else {
    row.innerHTML += '<td class="empty">&nbsp;</td>';
  }
  var scoreCell = createCell(assignment.score, true, assignment, 'score', function(){updateRow(assignment.id)});

  var outOfCell = createCell(assignment.outOf, true, assignment, 'outOf', function(){updateRow(assignment.id)});

  row.setAttribute("id", "r"+assignment.id);
  row.append(createCell(assignment.name, true, assignment, 'name', function(){updateRow(assignment.id)}));
  row.append(scoreCell);
  row.append(outOfCell);
  row.append(createCell(assignment.percent, false, assignment, 'percent'));
  var cancelCell = createCancelCell(assignment, "cancel");
  row.append(cancelCell);

  return row;
}

function createCancelCell(assignment, title){
  var cell = document.createElement('td');
  cell.innerHTML = "&times;";
  cell.setAttribute("id", title+assignment.id);
  cell.setAttribute("class", "cancel");
  cell.addEventListener("click", function(){
    deleteAssignment(assignment.id);
  })
  return cell;
}

function deleteAssignment(id){
  var ass = getAssignmentById(id);
  let assi;
  for (cate of categories){
    for (a in cate.assignments){
      assi = cate.assignments[a]
      if (assi.id == id){
        var r = $("#r"+id)[0];
        r.remove();
        cate.assignments.splice(a, 1);
        // alert("hi");
      }
    }
  }
  updateGrade();
}

function updateRow(aid){
  var r = $("#r"+aid)[0];
  var name = $("#name"+aid).val();
  var score = $("#score"+aid).val();
  var outOf = $("#outOf"+aid).val();
  var percent;
  if (!isNaN(score/outOf)){
    percent = (((score/outOf) * 100)).toFixed(2).toString() + '%';
  } else {
    percent = '';
  }
  //console.log("score: "+score+"   outOf: "+outOf+"    name: "+name+"    percent: "+percent);
  //console.log(percent);
  r.cells[4].innerHTML = percent;

  // var ass = assignments[getAssignmentById(aid)];
  var ass = getAssignmentById(aid);
  ass.name = name;
  ass.score = score;
  ass.outOf = outOf;
  updateGrade();
  //r.cells[4].innerHTML = "35%";
}

function createCell(text, isInput, assignment, opt_title, opt_updateFunction) {
  var cell = document.createElement('td');
  var title = null;
  if (opt_title !== undefined && opt_title !== null) {
    cell.setAttribute('title', opt_title);
    title = opt_title;
  }
  if (isInput) {
    let ip = document.createElement('input');
    title == 'score' || title == 'outOf' ? ip.setAttribute('type', 'number') : ip.setAttribute('type', 'text')
    ip.setAttribute('value', text);
    cell.appendChild(ip);
    ip.setAttribute("id", opt_title+assignment.id);
    ip.setAttribute("onfocus", "this.select()");
    if (opt_updateFunction !== undefined && opt_updateFunction !== null){
      cell.addEventListener("change", function(){
        opt_updateFunction();
      })
    }
  } else {
    cell.innerHTML = text;
  }

  return cell;
}

function createNewCategoryButton(){
  let button = document.createElement('button');
  button.setAttribute('style', 'color: black; font-weight: bold;');
  button.setAttribute('onclick', 'createCategory()');
  button.setAttribute('id', 'newCategoryButton');
  button.setAttribute('class', 'greenbutton');
  button.innerHTML = '&plus;&nbsp;New Category<br><br>';

  return button;
}

function undrawTables(){
  let div = document.getElementById('t');
  div.innerHTML = '';
  div.appendChild(createNewCategoryButton());
}

b.appendChild(createNewCategoryButton());
