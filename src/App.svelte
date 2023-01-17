<script>
	let rawtext = "";
	let categories = [];
	let grade = 0;
	let b = document.getElementById('t');
	let temp;
	$: grades = false;
	$: newcat = [false];
	$: newcatidx = 0;

	const returnNada = () => '';
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
		linestext.forEach(linetext => lines = [...lines, new Line(linetext)]);

		categories = [];

		lines.forEach(ass => 
		{
			if (ass.score == "--")
			{
				return;
			}
			if (cats.indexOf(ass.category)==-1)
			{
				let temparr = []
				var newc = new Category(ass.category, 0.2, temparr);
				cats = [...cats, ass.category];
				categories = [...categories, newc];
			}
		});

		var per = 1/categories.length;

		categories.forEach(tempcat => tempcat.weight = Math.floor(per*100)/100);

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
					categories[i].assignments = [...categories[i].assignments, ass];
				}
			}
		});
		document.getElementById("finalgrade").style.visibility = "visible";
		calcGrade();
		grades = true;
	}

	function Line(text, name, score, outOf, category)
	{
		if(text == "")
		{
			this.name = name;
			this.score = score;
			this.outOf = outOf;
			this.percent = ((parseFloat(this.score) / parseFloat(this.outOf) * 10000) >> 0) / 100;
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
			this.percent = ((parseFloat(this.score) / parseFloat(this.outOf) * 10000) >> 0) / 100;
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
			
			if (cat.assignments.length == 0)
			{
				return;
			}

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
		updateCategoryGrades();
	}

	function updateAssignments()
	{
		categories.forEach(cat => {
			let temp = 0;
			cat.assignments.forEach(ass => {
				ass.score = document.getElementsByClassName(cat.name + "in")[temp].value;
				ass.outOf = document.getElementsByClassName(cat.name + "out")[temp].value;
				ass.percent = ((parseFloat(ass.score) / parseFloat(ass.outOf) * 10000) >> 0) / 100;
				document.getElementsByClassName(cat.name + "percent")[temp].innerHTML = "" + ass.percent + "%";
				temp++;
			});
		});
		calcGrade();
		updateCategoryGrades();
	}

	function addAssignment(cat)
	{
		let assnum = numAssignments() + 1;
		for(let i = 0; i < categories.length; i++)
		{
			if(categories[i].name == cat)
			{
				categories[i].assignments = [...categories[i].assignments, new Line("", "New Assignment " + assnum, 0, 100, cat)];
			}
		}
		let table = document.getElementById(cat + "table");
		let lastRow = table.rows[ table.rows.length - 1 ];
		let clonedRow = table.rows[ table.rows.length - 2 ].cloneNode(true);
		clonedRow.cells[0].innerHTML = "<input type='text' value='New Assignment " + assnum + "'>";
		clonedRow.cells[1].childNodes[0].addEventListener("change", updateAssignments);
		clonedRow.cells[2].childNodes[0].addEventListener("change", updateAssignments);

		// table.insertBefore(clonedRow, lastRow);
		updateAssignments();
	}

	function addCategory()
	{
		let catnum = categories.length + 1;
		let assnum = numAssignments() + 1;
		categories = [new Category("New Category " + catnum, 0, [new Line("", "New Assignment " + assnum, 0, 100, "New Category " + catnum)]), ...categories];
		newcat[newcatidx] = true;
	}

	function updateCatIndex()
	{
		newcatidx++;
	}

	function numAssignments()
	{
		let temp = 0;
		categories.forEach(cat => {
			temp += cat.assignments.length;
		});
		return temp;
	}

	function updateCategoryGrades()
	{
		for(let i = 0; i < categories.length; i++)
		{
			let points = 0;
			let total = 0;
			categories[i].assignments.forEach(ass => {
				points += parseFloat(ass.score);
				total += parseFloat(ass.outOf);
			});
			document.getElementsByClassName(categories[i].name + "grade")[0].innerHTML = "<h3>" + (Math.round((points/total) * 10000) / 100) + "%</h3>";
		}
	}

	function removeAssignment(assName)
	{
		for(let i = 0; i < categories.length; i++)
		{
			for(let j = 0; j < categories[i].assignments.length; j++)
			{
				if(categories[i].assignments[j].name == assName)
				{
					categories[i].assignments.splice(j, 1);
					document.getElementsByClassName(assName+"row")[0].remove();
				}
			}
		}
		updateAssignments();
	}

	function save()
	{
		var data = {
			'assignments': categories,
		};

		var name = prompt("Enter class name");

		localStorage.setItem(name, JSON.stringify(data));
		loadMenu();
	}

	function loadClass()
	{
		var name = menu.value;
		var data = JSON.parse(localStorage.getItem(name));
		categories = data.assignments;
		loadMenu();
		grades = true;
		calcGrade();
		document.getElementById("finalgrade").style.visibility = "visible";
	}

	function loadMenu()
	{
		let menu = document.getElementById('loadSelect');
		menu.innerHTML = "<option value='' selected disabled hidden>Choose here</option>";
		var saves = Object.keys(localStorage);

		saves.forEach ((x) => {
			var o = document.createElement("option");
			o.value = x;
			o.innerText = x;

			menu.appendChild(o);
		});
	}

	function deleteClass()
	{
		let menu = document.getElementById('loadSelect');
		var name = menu.value;
		localStorage.removeItem(name);
		loadMenu();
	}
</script>

<style>
	textarea
	{
		width: 75%;
	}

	td
	{
		padding: 1px;
	}

	main
	{
		font-size: 14px;
		line-height: 12px;
	}

	.cancel
	{
		color: red;
	}
	.cancel:hover
	{
		cursor: pointer;
	}

	input
	{
		height:30px;
	}

	.border
	{
		border-style: solid;
	}

	.inh
	{
		width:50px;
	}

	#addcat:hover
	{
		cursor: pointer;
	}
</style>

<main>
	<center>
		<div>
			<h1>Grade Perturber</h1>
		</div>
		<div id = "top">
			<textarea type="text" rows="8" value={rawtext} id="entry" placeholder="Copy and paste your assigments from PowerSchool!"></textarea>
			<br>
			<table style = "width: 90%">
				<tr style="margin-bottom:0.5px"> 
					<td></td>
					<td style="text-align:center; font-weight:bold;" colspan="2"><button on:click={load}>Load</button></td>
					<td></td>
				</tr>
			</table>
			to view an example, see <a href="https://gist.github.com/rjain37/cf138605e890fe6be9b8d25f648d7151">here</a>
			<hr style="width:75%">
			<button value="Save" on:click={save}>Save</button>
			<select id="loadSelect"><option value="" selected="" disabled="" hidden="">Choose here</option></select>
			<script>
				let menu = document.getElementById('loadSelect');
				menu.innerHTML = "<option value='' selected disabled hidden>Choose here</option>";
				var saves = Object.keys(localStorage);

				saves.forEach ((x) => {
					var o = document.createElement("option");
					o.value = x;
					o.innerText = x;

					menu.appendChild(o);
				});
			</script>
			<button value="Load" on:click={loadClass}>Load</button>
			<button value="Del" on:click={deleteClass}>Delete</button>
		</div>

		<div id="t">
			<h2 style="visibility:hidden;" id="finalgrade">&nbsp; &nbsp; Grade: {((grade * 10000) >> 0) / 100}%</h2>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<p id = "addcat" style="position:relative; right: 24%;" on:click={addCategory}><strong>+ Add Category</strong></p>
			{#each categories as cat}
				<table style = "width: 55%" id = "{cat.name}table" class="border" CELLSPACING=0>
					<tr style="margin-bottom:0.5px; background-color:#D3B5E5"> 
						<td style="width:25%"></td>
						<td style="text-align:center; width:35%;" colspan="2"><h3 style="display:inline">{cat.name}</h3>&nbsp; <input class = "inh" value = {cat.weight*100} type = "number" on:change={updateGrade}></td>
						<td style="text-align:right; width:15%"></td>
						<td style="text-align:center; width:10%" class="{cat.name}grade"></td>
					</tr>
					<tr>
						<td style="text-align:center; font-weight:bold; width:25%"><h4>Assignment</h4></td>
						<td style="text-align:center; font-weight:bold; width:25%"><h4>Points</h4></td>
						<td style="text-align:center; font-weight:bold; width:25%"><h4>Out of</h4></td>
						<td style="text-align:center; font-weight:bold; width:15%"><h4>Score</h4></td>
						<td style="text-align:center; font-weight:bold; widht:10%"><h4>Remove</h4></td>
					</tr>
					{#each cat.assignments as ass}
						<tr class="{ass.name}row">
							<td style="text-align:center; width:25%" class="{ass.name}name"><input value = {ass.name} type="text"></td>
							<td style="text-align:center; width:25%"><input class="{cat.name}in" value = {ass.score} type = "number" on:change={updateAssignments}></td>
							<td style="text-align:center; width:25%"><input class="{cat.name}out" value = {ass.outOf} type = "number" on:change={updateAssignments}></td>
							<td style="text-align:center; width:15%; padding-bottom: 8.5px;" class="{cat.name}percent">{ass.percent}%</td>
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<td style="text-align:center; width:10%; padding-bottom: 8.5px;" class ="cancel" on:click={removeAssignment(ass.name)}>x</td>
						</tr>
					{/each}
					<tr>
						<td></td>
						<td style="text-align:center" colspan="2"><button class="{cat.name}button" on:click={addAssignment(cat.name)}>New Assignment</button></td>
						<td></td>
					</tr>
				</table>
				<br>
			{/each}
			{#if grades}
				{returnNada(updateCategoryGrades())}
			{/if}
			{#if newcat[newcatidx]}
				{returnNada(updateGrade())}
				{returnNada(updateCatIndex())}
			{/if}
		</div>
	</center>
</main>