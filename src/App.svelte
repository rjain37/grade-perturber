<script>
	let rawtext = "";
	let categories = [];
	let grade = 0;
	let b = document.getElementById('t');

	const load = () => 
	{
		rawtext = document.getElementById("entry").value;
		let linestext = rawtext.split("\n");

		if (rawtext.startsWith("Welcome, "))
		{
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

		if (linestext[0].startsWith("Due Date"))
		{
			linestext.shift();
		}
		linestext.forEach(linetext => lines.push(new Line(linetext)));

		// console.log(lines);
		categories = [];

		lines.forEach(ass => 
		{
			if (cats.indexOf(ass.category)==-1)
			{
				let temparr = []
				var newc = new Category(ass.category, 0.2, temparr);
				cats.push(ass.category);
				categories.push(newc);
			}
		});

		var per = 1/categories.length;

		categories.forEach(tempcat => tempcat.weight = Math.floor(per*100)/100);

		// console.log(categories);
		lines.forEach(ass => 
		{
			if (ass.score == "--")
			{
				return;
			}
			for(let i = 0; i < categories.length; i++)
			{
				if (categories[i].name == ass.category)
				{
					categories[i].assignments.push(ass);
				}
			}
		});
		document.getElementById("finalgrade").style.visibility = "visible";
		calcGrade();
	}

	function Line(text, name, score, outOf, category)
	{
		if(text == "")
		{
			this.name = name;
			this.score = score;
			this.outOf = outOf;
			this.category = category;
		}
		else
		{
			this.splitted = text.split("\t");
			this.category = this.splitted[1];
			this.name = this.splitted[2];
			this.gradetext = this.splitted[10];
			this.score = this.gradetext.substr(0, this.gradetext.indexOf('/'));
			this.outOf = this.gradetext.substr(this.gradetext.indexOf('/')+1, this.gradetext.length);
		}
	}

	function Category(name, weight, assignments)
	{
		this.weight = weight;
		this.name = name;
		this.assignments = assignments;
	}

	function calcGrade()
	{
		let tempGrade = 0;
		let totalPercent = 0;
		categories.forEach(cat => {
			let points = 0;
			let total = 0;

			cat.assignments.forEach(ass => {
				points += parseFloat(ass.score);
				total += parseFloat(ass.outOf);
			});
			tempGrade += (points/total) * cat.weight;
			totalPercent += cat.weight;
		});
		grade = tempGrade / totalPercent;
	}

	function updateGrade()
	{
		let temp = 0;
		categories.forEach(cat => {
			cat.weight = parseFloat(document.getElementsByClassName("inh")[temp].value)/100;
			temp++;
		});
		calcGrade();
	}

	function updateAssignments()
	{
		categories.forEach(cat => {
			let temp = 0;
			cat.assignments.forEach(ass => {
				ass.score = document.getElementsByClassName(cat.name + "in")[temp].value;
				ass.outOf = document.getElementsByClassName(cat.name + "out")[temp].value;
				temp++;
			});
			// console.log(cat.assignments);
		});
		calcGrade();
	}

	function addAssignment(cat)
	{
		let assnum = numAssignments() + 1;
		for(let i = 0; i < categories.length; i++)
		{
			if(categories[i].name == cat)
			{
				categories[i].assignments.push(new Line("", "New Assignment " + assnum, 0, 100, cat));
			}
		}
		let table = document.getElementById(cat + "table");
		let lastRow = table.rows[ table.rows.length - 1 ];
		let clonedRow = table.rows[ table.rows.length - 2 ].cloneNode(true);
		clonedRow.cells[0].innerHTML = "New Assignment " + assnum;
		clonedRow.cells[0].innerHTML = "<input type='text' value='New Assignment " + assnum + "'>";
		clonedRow.cells[1].childNodes[0].addEventListener("change", updateAssignments);
		clonedRow.cells[2].childNodes[0].addEventListener("change", updateAssignments);

		// console.log(clonedRow.cells[1].childNodes[0])
		table.insertBefore(clonedRow, lastRow);
		updateAssignments();
	}

	function numAssignments()
	{
		let temp = 0;
		categories.forEach(cat => {
			temp += cat.assignments.length;
		});
		return temp;
	}
</script>

<style>
	textarea
	{
		width: 90%;
	}

	.inh
	{
		color: inherit;
		border-bottom: 0.5px solid white;
		font-size:16px;
		min-width: none;
		width: 50px;
	}
	td
	{
		padding: 1px;
	}
</style>

<main>
	<center>
		<div>
			<h1>Grade Perturber</h1>
		</div>
		<div>
			<textarea type="text" rows="8" value={rawtext} id="entry" placeholder="Copy and paste your assigments from PowerSchool!"></textarea>
			<br>
			<button on:click={load}>load</button>
			<br>
		</div>

		<div id="t">
			<h2 style="visibility:hidden;" id="finalgrade">Grade: {((grade * 10000) >> 0) / 100}%</h2>
			{#each categories as cat}
				<table style = "width: 95%" id = "{cat.name}table">
					<tr style="margin-bottom:0.5px"> 
						<td></td>
						<td style="text-align:right; font-weight:bold; width:25%">{cat.name}</td>
						<td style="text-align:left; width:25%"><input class = "inh" value = {cat.weight*100} type = "number" on:change={updateGrade}></td>
						<td></td>
					</tr>
					<tr>
						<td style="text-align:left; font-weight:bold; width:25%">Assignment</td>
						<td style="text-align:center; font-weight:bold; width:25%">Points</td>
						<td style="text-align:center; font-weight:bold; width:25%">Out of</td>
						<td style="text-align:right; font-weight:bold; width:25%">Score</td>
					</tr>
					{#each cat.assignments as ass}
						<tr>
							<td style="text-align:left; width:25%" class="{ass.name}name">{ass.name}</td>
							<td style="text-align:center; width:25%"><input class="{cat.name}in" value = {ass.score} type = "number" on:change={updateAssignments}></td>
							<td style="text-align:center; width:25%"><input class="{cat.name}out" value = {ass.outOf} type = "number" on:change={updateAssignments}></td>
							<td style="text-align:right; width:25%">{(((ass.score / ass.outOf * 100) * 100) >> 0) / 100}%</td>
						</tr>
					{/each}
					<tr>
						<td><button class="{cat.name}button" on:click={addAssignment(cat.name)}>New Assignment</button></td>
					</tr>
				</table>
				<br><br>
			{/each}
		</div>

	</center>
</main>