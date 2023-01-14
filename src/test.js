function save () {
    var name = prompt("Save name (class name)");

    var assignmentList = tableRows(assignments).map((x) => {
        var cells = x.cells;
        return [cells[0].innerText, cells[1].innerText, cells[2].innerText, cells[3].childNodes[0].value, cells[4].childNodes[0].value]
    })

    var weightDict = {};

    tableRows(weights).forEach ((x) => {
        weightDict[x.cells[0].innerText] = parseFloat(x.cells[1].childNodes[0].value);
    })

    var data = {
        'assignments': assignmentList,
        'weights': weightDict
    };
    
    localStorage.setItem(name, JSON.stringify(data));

    loadMenu();
}

function load () {
    var name = menu.value;
    
    if (!Object.keys(localStorage).includes(name))
        return alert("Choose a save");

    while (assignments.rows.length > 1) 
        assignments.deleteRow(1);
    while (weights.rows.length > 1)
        weights.deleteRow(1);
    
    var data = JSON.parse(localStorage.getItem(name));

    var assignmentList = data['assignments'],
        weightDict = data['weights'];

    assignmentList.forEach((x)=> {
        addAssignment(x[0], x[1], x[2], x[3], x[4])
    });

    tableRows(weights).forEach ((x) => {
        var key = x.cells[0].innerText;

        x.cells[1].childNodes[0].value = weightDict[key];
    });
        
    process();

    loadMenu();
}

function loadMenu () {
    menu.innerHTML = "<option value='' selected disabled hidden>Choose here</option>";
    var saves = Object.keys(localStorage);

    saves.forEach ((x) => {
        var o = document.createElement("option");
        o.value = x;
        o.innerText = x;

        menu.appendChild(o);
    });
}

function delSave () {
    var name = menu.value;
    localStorage.removeItem(name);
    loadMenu();
}

loadMenu()
