//reads all data for updating once button is pressed
var entry = $("#entry");

function read(){
	let rawtext = entry.val();
	var linestext = rawtext.split("\n");

	if (rawtext.startsWith("Welcome, ")){
		let temparr = rawtext.split("Assignments");
		let temparr2 = temparr[1].split("Grades last updated on");
		rawtext = temparr2[0];
		linestext = rawtext.split("\n");

		//some formatting that deals with extra lines
		linestext.shift();
		linestext.shift();
		linestext.pop();
	}

	var lines = [];
	var cats = [];
	var ids = [];

	if (linestext[0].startsWith("Due Date")){
		linestext.shift();
	}
	for (linetext of linestext){
		lines.push(new Line (linetext));
	}

	undrawTables();
	categories = [];

	for (ass of lines){
		var cid;
		if (cats.indexOf(ass.category)==-1){
			var newc = new Category(ass.category, 0.2);
			cats.push(ass.category);
			categories.push(newc);
			cid = newc.id;
			ids.push(newc.id);
		}
	}

	var per = 1/categories.length;
	for (tempcat of categories){
		tempcat.weight = Math.floor(per*100)/100;
	}

	drawTables();

	for (ass of lines){
		if (ass.score == "--"){
			continue;
		}
		cid = ids[cats.indexOf(ass.category)];
		newAssignment(cid, ass.name, ass.score,ass.outOf,false);
	}
	$("#weightnotice").css("display", "block");

}

function Line(text){
	this.splitted = text.split("\t");
	this.category = this.splitted[1];
	this.name = this.splitted[2];
	this.gradetext = this.splitted[10];
	this.score = this.gradetext.substr(0, this.gradetext.indexOf('/'));
	this.outOf = this.gradetext.substr(this.gradetext.indexOf('/')+1, this.gradetext.length);
}
