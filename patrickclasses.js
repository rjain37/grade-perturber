function Category(name, weight)
{
    this.weight = weight;
    this.name = name;
    this.id = 'c'+ID();
    this.assignments = [];
}
  
  Category.prototype.categoryMakeup = function(){
    var tof = 0;
    var ts = 0;
    this.assignments.map(function(x){
      ts += parseFloat(x.score);
      tof += parseFloat(x.outOf);
    })
  
  
    if (tof == 0 || ts == 0){
      return null;
    }
    let makeup = this.weight * (ts/tof);
    let scorep = $("#score"+this.id);
    scorep.text((100*(ts/tof)).toFixed(2)+"%");
  
    return makeup;
  }
  
  
  var ID = function () {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  };
  let n = 1;
  function Assignment(tableId){
    this.name = 'New Assignment';
    this.category = getCategoryById(tableId);
    if (n > 1) this.name += " "+n;
    let table = $("#"+tableId);
    var lastAssignment = this.category.assignments[this.category.assignments.length - 1];
    if (lastAssignment!=null){
      this.score = lastAssignment.score;
      this.outOf = lastAssignment.outOf;
    } else {
      this.score = 10;
      this.outOf = 10;
    }
    this.id = ID();
    this.category.assignments.push(this);
    n++;
  }
  