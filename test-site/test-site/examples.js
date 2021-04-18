
function fib(n) {
    if (n < 2) {
        return 1;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}

function square(n) {
    return n * n;
}

function funcWithOtherFuncs(n) {
    return fib(square(n) / n);
}


// Refactorable examples
async function example1() {
    data = [36, 37, 38, 39, 40, 41, 42,36, 37, 38, 39, 40, 41, 42,36, 37, 38, 39, 40, 41, 42];

    for (let i = 0; i < data.length; i++) {
        let value = data[i];
        data[i] = fib(value);
    }

    return data;
}

async function example2() {
    data = [36, 37, 38, 39, 40, 41, 42];

    for (let i = 0; i < data.length; i++) {
        let value = data[i];
        data[i] = funcWithOtherFuncs(value);
    }

    return data;
}

async function example3() {
    data1 = [36, 37, 38, 39, 40, 41, 42];
    data2 = [1, 3, 5, 3, 2, 7, 10];
    aGlobal = "Hello";

    for (let i = 0; i < data1.length; i++) {
        let value = data1[i];
        data1[i] = funcWithOtherFuncs(value) + fib(data2[i]) + aGlobal;
    }

    return data1;
}


// non-refactorable examples
async function exampleNotRefactorable1() {
    ar = [10, 20, 30, 40, 50];
    x = 5;

    for (let n = 0; n < ar.length; n++) {
        x = x + 1;
        ar[n] = x;
    }

    return ar;
}

async function exampleNotRefactorable2() {
    for (let n = 0; n < 10; n++) {
        console.log("There is no array in this loop");
    }
    return ar;
}

async function exampleNotRefactorable3() {
    ar = [10, 20, 30, 40, 50];

    for (let n = 0; n < ar.length; n++) {
        ar[i] = externalFunction();
    }

    return ar;
}



async function showOutput(f) {

    let out = document.getElementById("out");
    let res = document.getElementById("res");
    out.innerHTML = "Running...";
    res.innerHTML = "";

    setTimeout(async function(){  
        const t1 = performance.now();
        let result = await f();
        const t2 = performance.now();
        time = Math.round(t2 - t1);
        let newStr = `Done in ${time}ms<br>`;
        let resStr = "";
        result.forEach((r) => {
            resStr += `${r}<br>`;
        });
        
        out.innerHTML = newStr;
        res.innerHTML = resStr;
    }, 10);
}

