const inputDataList = document.querySelectorAll('.input-data input');
const btnCalc = document.querySelector('.btnCalc');
const outputData = document.querySelectorAll('.output-data li');
const K095 = 2.294; // коэффициент при доверит. вероятности 0,95 для 10-ти измерений
let limit; // допустимая погрешность в %С
// nMin минимальное значение из 10 измерений
// value - значение
// index - индекс в массиве значений
// k - коэффициент расчитанный по формуле
// isGood - учавствует ли он в расчетах или выпадает
let nMin = {
    value: 0,
    index: 0,
    k: 0,
    isGood: true
};

let nMax = {
    value: 0,
    index: 0,
    k: 0,
    isGood: true
};

let valuesOfInputs = [];
let ns;
let snResult; // Sn - абсолютное СКО результатов анализов

isBigErrors = false; // при true - пересчитать заново без отброшенных значений





// Выбор типа прибора
// у них разный допуск погрешности
let currentAn = 7529;
const btnAn = document.querySelectorAll('[data-an]');
for (let el of btnAn) {
    el.addEventListener('click', function(event) {
        currentAn = +event.target.dataset.an;
        for (let btn of btnAn) {
            btn.className = '';
        }
        event.target.className = 'selected';
    })
}

// кнопка Расчет
btnCalc.addEventListener('click', start);

function start() {
    const input = document.querySelector('.input-data');
    input.classList.add('hiden');
    const output = document.querySelector('.output-data');
    output.classList.remove('hiden');
    btnCalc.classList.add('hiden');
    const img = document.querySelector('header img');
    img.classList.add('hiden');
    for (let an of btnAn) {
        if(an.classList.contains('selected')){
            an.classList.add('protocol');
        } else {
            an.classList.add('hiden');
        }
    }


    calculation();
}





/*
    Расчет МХ газоанализатора
*/
function calculation() {

    // создаём массив входных данных из инпутов
    createValueArrayFromInputs();

    // расчет Ns среднее арифметическое всех измерений
    ns = calcNs();

    // расчет Sn - абсолютное СКО результатов анализов
    snResult = calcSn();

    // проверяем на грубые погрешности
    checkBigErrors();

    // если какие-либо значения были отброшены - 
    // нужно сделать новый перерасчет Ns и Sn
    if (isBigErrors) {
        ns = calcNs();
        snResult = calcSn();
    }

    // расчет допустимой погрешности
    limit = calcLimit();

    // вывод результатов на страницу
    outputInfo();
}




// создаём массив входных данных из инпутов
function createValueArrayFromInputs () {
    for (let i = 0; i < inputDataList.length; i++) {
        // сразу копируем значения в блок вывода
        outputData[i].innerHTML = inputDataList[i].value;
        valuesOfInputs[i] = Number(inputDataList[i].value);
    }
}

// расчет Ns среднее арифметическое всех измерений
function calcNs() {
    let sum = 0;

    for (let value of valuesOfInputs) {
        sum += value;
    }

    sum = +sum.toFixed(10);
    let ns = sum / valuesOfInputs.length;
    return ns;
}




// расчет Sn - абсолютное СКО результатов анализов
function calcSn() {

    // расчет суммы квадратов (Ni - Ns)
    let sub = 0; // разность Ni и Ns
    let sq = 0; // возведение в квадрат разности (Ni-Ns)
    let sum = 0; // сумма квадратов (Ni-Ns)
    for (let i = 0; i < valuesOfInputs.length; i++) {
        sub = (valuesOfInputs[i] - ns);
        sq = Math.pow(sub, 2);
        sum += sq;
    }
    sum = +sum.toFixed(10);

    // извлекаем корень
    let underRoot = (1 / (valuesOfInputs.length - 1)) * sum; 
    let sn = Math.sqrt(underRoot);

    return +sn.toFixed(7);
}

// проверяем на грубые погрешности
function checkBigErrors() {
    // находим значения с наибольшим отклонением (min и max)
    findMinMax();
    // nMin.value = Math.min(...valuesOfInputs);
    // nMax.value = Math.max(...valuesOfInputs);

    nMin.k = (ns - nMin.value) / snResult;
    nMax.k = (nMax.value - ns) / snResult;

    nMin.k = nMin.k.toFixed(4);
    nMax.k = nMax.k.toFixed(4);

    // выпадают ли худшие значения из расчетов
    let delIndex;
    if (nMin.k > K095) {
        nMin.isGood = false;
        isBigErrors = true;
        
        delIndex = function(v, index) {
            return index !== nMin.index;
        };
    }

    if (nMax.k > K095) {
        nMax.isGood = false;
        isBigErrors = true;

        if (!nMin.isGood) {
            delIndex = function(v, index) {
                return (index !== nMin.index && index !== nMax.index);
            };
        } else {
            delIndex = function(v, index) {
                return index !== nMax.index;
            };
        }
    }

    // если какие-либо результаты выпадают - 
    // создаём новый массив без выпавших значений
    if (isBigErrors) {
        valuesOfInputs = valuesOfInputs.filter(delIndex);
    }
}


function findMinMax() {
    nMin.value = nMax.value = valuesOfInputs[0];
    
    for (let i = 1; i < valuesOfInputs.length; i++) {
        if (valuesOfInputs[i] < nMin.value) {
            nMin.value = valuesOfInputs[i];
            nMin.index = i;
        } else if (valuesOfInputs[i] > nMax.value) {
            nMax.value = valuesOfInputs[i];
            nMax.index = i;
        }
    }
}

// расчет допустимой погрешности
function calcLimit() {
    let x;
    if (currentAn === 7529) {
        x = 0.0025;
    } else if (currentAn === 7560) {
        x = 0.0005;
        console.log("x=" + x);
    } else console.log('Error не верный тиа АНа');

    limit = ( (0.005 * ns) + x); // %C

    return +limit.toFixed(7)
}

function outputInfo() {
    // nu min
    const nuMin = document.querySelector('.nu-min');
    nuMin.innerHTML = `Ni min = ${nMin.value}%C<br> &nu; для Ni min = ${nMin.k}`;
    if (nMin.k > K095) {
        nuMin.innerHTML += ` > 2.294 - отбрасывается`;
    } else {
        nuMin.innerHTML += ` < 2.294 - не отбрасывается`;
    }

    // nu max
    const nuMax = document.querySelector('.nu-max');
    nuMax.innerHTML = `Ni max = ${nMax.value}%C<br> &nu; для Ni max = ${nMax.k}`;
    if (nMax.k > K095) {
        nuMax.innerHTML += ` > 2.294 - отбрасывается`;
    } else {
        nuMax.innerHTML += ` < 2.294 - не отбрасывается`;
    }

    // Sn
    const SnText = document.querySelector('.sn');
    SnText.innerHTML = `Абсолютное СКО результатов анализов:<br> <span class="small">(расчёт Sn выполнен по ${valuesOfInputs.length}-ти значениям)</span><br>Sn = ${snResult}%C`;

    // limit
    const limitText = document.querySelector('.limit');
    limitText.innerHTML = `Допустимое значение:<br> Sn = +-${limit}%C для АН-${currentAn}М`;

    // conclusion
    const conclusionText = document.querySelector('.conclusion');
    let result;
    if (snResult > limit) {
        result = "Не годен";
        conclusionText.classList.add('red');
    } else {
        result = "Годен";
        conclusionText.classList.add('green');
    }
    conclusionText.innerHTML = `Вывод: ${result}`;
}


