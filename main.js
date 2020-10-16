const xml2js = require('xml2js');
const ColorHash = require('color-hash');
const sha256 = require('js-sha256').sha256;

const XML_URL = '/sys/download.html?file_id=16072';
//const XML_URL = 'sample.xml'; //debug
const ROOT_ID = 'asctt';

window.onload = () => {
    let div = document.getElementById(ROOT_ID);
    let tableContainer;
    let asc;
    let colorHash = new ColorHash({ lightness: 0.7, saturation: 0.9 });
    let teacherPass = '';
    let passMsg;

    let doesPassMatch = () => new Promise((resolve, reject) => {
        resolve(sha256(teacherPass+'_75c78406c6ad56772') === '61e9d7f3c7e11ffc88dfd9af3010bd0d7daf8ec3421f6ab1b83bb6041b38636a');
    });

    let getTableHead = () => {
        return '<thead><tr><th></th><th>Poniedziałek</th><th>Wtorek</th><th>Środa</th><th>Czwartek</th><th>Piątek</th></tr></thead>';
    };

    let getClass = id => asc.timetable.classes[0].class.find(_class => _class.$.id === id);
    let getTeacher = id => asc.timetable.teachers[0].teacher.find(teacher => teacher.$.id === id);
    let getClassrom = id => asc.timetable.classrooms[0].classroom.find(classroom => classroom.$.id === id);
    let getSubject = id => asc.timetable.subjects[0].subject.find(subject => subject.$.id === id);
    let getGroup = id => asc.timetable.groups[0].group.find(group => group.$.id === id);
    let getPeriod = id => asc.timetable.periods[0].period.find(period => period.$.period === String(id));

    let getTablePeriod = id => {
        let td = document.createElement('td');
        let period = getPeriod(id);
        td.innerText = period.$.starttime + ' - ' + period.$.endtime;
        return td;
    };

    let getTableLesson = (subject, teacher, color, classroom, group) => {
        let td = document.createElement('td');
        if (color) td.style.background = color;
        let subjectSpan = document.createElement('span');
        subjectSpan.classList.add('subject');
        subjectSpan.innerText = subject;
        let classroomSpan = document.createElement('span');
        classroomSpan.classList.add('classroom');
        classroomSpan.innerText = classroom;
        if (group) classroomSpan.innerHTML += ' <span>' + group + '</span>';
        let teacherSpan = document.createElement('span');
        teacherSpan.classList.add('teacher');
        teacherSpan.innerText = teacher;
        td.appendChild(subjectSpan);
        td.appendChild(classroomSpan);
        td.appendChild(teacherSpan);
        return td;
    };

    let printClassTt = id => {
        tableContainer.innerHTML = '';

        let tutorId = getClass(id).$.teacherid;
        let tutorName;
        if (tutorId) tutorName = getTeacher(tutorId).$.name;
        let p = document.createElement('p');
        let className = getClass(id).$.name;
        p.innerHTML = '<span class="printonly">Szkoła Podstawowa Nr 1 w Przeciszowie, plan klasy ' + className + '. </span>';
        if (tutorId) p.innerHTML += 'Wychowawca: ' + tutorName;
        p.innerHTML += '<span class="printonly">. Wygenerowano ' + new Date().toLocaleDateString() + '.</span>'
        tableContainer.appendChild(p);

        let table = document.createElement('table');
        table.innerHTML = getTableHead();
        for (let period = 1; period <= asc.timetable.periods[0].period.length; period++) {
            let tr = document.createElement('tr');
            tr.appendChild(getTablePeriod(period));

            for (let day = 0; day < 5; day++) {
                let classroomName = '';
                let subjectName = '';
                let teacherName = '';
                let groupName = '';
                let color = '';

                let cards = asc.timetable.cards[0].card.filter(card => card.$.period === String(period) && card.$.days.substr(day, 1) === '1');
                for (let card of cards) {
                    let lesson = asc.timetable.lessons[0].lesson.find(lesson => lesson.$.classids.includes(id) && lesson.$.id === card.$.lessonid);
                    if (lesson) {
                        let classroom = getClassrom(card.$.classroomids);
                        if (classroom) { classroomName = classroom.$.name; }
                        subjectName = getSubject(lesson.$.subjectid).$.name;
                        teacherName = getTeacher(lesson.$.teacherids).$.name;
                        color = getTeacher(lesson.$.teacherids).$.color;
                        for (let groupId of lesson.$.groupids.split(',')) {
                            let group = getGroup(groupId);
                            if (group.$.classid === id && group.$.entireclass === '0') groupName = group.$.name;
                        }
                        break;
                    }
                }

                let td = getTableLesson(subjectName, teacherName, color, classroomName, groupName);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        tableContainer.appendChild(table);
    };

    let printTeacherTt = id => {
        tableContainer.innerHTML = '';

        let table = document.createElement('table');
        table.innerHTML = getTableHead();
        for (let period = 1; period <= asc.timetable.periods[0].period.length; period++) {
            let tr = document.createElement('tr');
            tr.appendChild(getTablePeriod(period));

            for (let day = 0; day < 5; day++) {
                let classroomName = '';
                let subjectName = '';
                let className = '';
                let groupName = '';
                let color = '';

                let cards = asc.timetable.cards[0].card.filter(card => card.$.period === String(period) && card.$.days.substr(day, 1) === '1');
                for (let card of cards) {
                    let lesson = asc.timetable.lessons[0].lesson.find(lesson => lesson.$.teacherids.includes(id) && lesson.$.id === card.$.lessonid);
                    if (lesson) {
                        if (getClassrom(card.$.classroomids)) classroomName = getClassrom(card.$.classroomids).$.name;
                        subjectName = getSubject(lesson.$.subjectid).$.name;
                        for (let groupId of lesson.$.groupids.split(',')) {
                            let group = getGroup(groupId);
                            if (group.$.classid === id && group.$.entireclass === '0') groupName += group.$.name + ' / ';
                            className += getClass(group.$.classid).$.short + ' / ';
                        }
                        groupName = groupName.substr(0, groupName.length-3);
                        className = className.substr(0, className.length-3);
                        break;
                    }
                }

                if (subjectName) color = colorHash.hex(subjectName);

                let td = getTableLesson(subjectName, className, color, classroomName, groupName);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        tableContainer.appendChild(table);
    };

    let parseAsctt = data => {
        asc = data;

        doesPassMatch().then(teacherVerified => {
            div.innerHTML = '';

            let labelClasses = document.createElement('label');
            labelClasses.innerText = 'Wybierz klasę: ';
            div.appendChild(labelClasses);

            let selectClasses = document.createElement('select');
            for (let _class of asc.timetable.classes[0].class) {
                if (/^\d+$/.test(_class.$.name.substr(0, 1)) || (_class.$.name.toLowerCase().includes('zaj') && _class.$.name.toLowerCase().includes('dod'))) { // skip classes with names not starting with a digit
                    let li = document.createElement('option');
                    li.value = _class.$.id;
                    li.innerText = _class.$.name;
                    selectClasses.appendChild(li);
                }
            }
            selectClasses.onchange = () => {
                selectTeachers.value = '';
                printClassTt(selectClasses.value);

            };
            div.appendChild(selectClasses);

            let labelTeachers = document.createElement('label');
            labelTeachers.innerText = ' lub nauczyciela: ';
            if (teacherVerified) div.appendChild(labelTeachers);

            let selectTeachers = document.createElement('select');
            for (let teacher of asc.timetable.teachers[0].teacher) {
                let li = document.createElement('option');
                li.value = teacher.$.id;
                li.innerText = teacher.$.name;
                selectTeachers.appendChild(li);
            }
            selectTeachers.onchange = () => {
                selectClasses.value = '';
                printTeacherTt(selectTeachers.value);
            };
            if (teacherVerified) div.appendChild(selectTeachers);

            let printButton = document.createElement('a');
            printButton.href = '#';
            printButton.onclick = e => {
                e.preventDefault();
                window.print();
                return false;
            };
            printButton.innerText = 'Drukuj plan';
            div.appendChild(printButton);

            if (!teacherVerified) {
                let teacherButton = document.createElement('a');
                teacherButton.href = '#';
                teacherButton.onclick = e => {
                    e.preventDefault();
                    teacherPass = prompt('Podaj hasło:');
                    doesPassMatch().then(match => {
                        if (match) parseAsctt(asc);
                        else passMsg.innerText = ' (wymaga hasła: hasło nieprawidłowe)';
                    });
                    return false;
                };
                teacherButton.innerText = 'Plan nauczycieli';
                div.appendChild(teacherButton);
                passMsg = document.createElement('span');
                passMsg.classList.add('small');
                passMsg.innerText = ' (wymaga hasła)';
                div.appendChild(passMsg);
            }

            tableContainer = document.createElement('div');
            div.appendChild(tableContainer);

            if (!teacherVerified) {
                selectTeachers.value = '';
                printClassTt(selectClasses.value);
            }
            else {
                selectClasses.value = '';
                printTeacherTt(selectTeachers.value);
            }
        });
    };

    let decoder = new TextDecoder('windows-1250');
    fetch(XML_URL)
        .then(response => response.arrayBuffer())
        .then(buf => decoder.decode(buf))
        .then(string => xml2js.parseStringPromise(string))
        .then(data => parseAsctt(data))
        .catch(err => {
            let p = document.createElement('p');
            p.innerText = 'Nie udało się załadować planu.';
            div.innerHTML = '';
            div.appendChild(p);
            console.error(err);
        });
};