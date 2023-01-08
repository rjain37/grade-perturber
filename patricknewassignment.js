//function to create new assignment
// let n = 1;
function newAssignment(tableid, opt_name, opt_score, opt_outOf, opt_isMock) {
    let cat = getCategoryById(tableid)
    // let name = 'New Assignment';
    // if (n>1){
    //   name += ' '+n
    // }
    let table = document.getElementById(tableid);
    let newAssignment = new Assignment(tableid);
    if (opt_name !== undefined && opt_name !== null){
      newAssignment.name = opt_name;
      newAssignment.score = opt_score;
      newAssignment.outOf = opt_outOf;
    }
  
    var isMock = true;
    if (opt_isMock !== undefined && opt_isMock !== null){
      isMock = opt_isMock;
    }
  
    assignments.push(newAssignment);
    let row = createRow(newAssignment, isMock);
  
    let lastRow = table.rows[ table.rows.length - 1 ];
    table.insertBefore(row, lastRow);
    updateGrade();
  }
  
  function getCategoryById(id) {
    for (c in categories) {
      if (categories[c].id == id){
        return categories[c];
      }
    }
    return null;
  }
  
  function getAssignmentById(id){
    for (a in assignments){
      if (assignments[a].id == id) return assignments[a];
    }
    return null;
  }
  