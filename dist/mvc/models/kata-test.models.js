"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const { db } = require("../../db/connection");
module.exports.insertSolutionToTests = (user_id, solutionToTest, kata_id, test_path) => __awaiter(void 0, void 0, void 0, function* () {
    if (!user_id) {
        return Promise.reject({
            status: 400,
            msg: "400 Bad Request: Can't check the solution without user_id!",
        });
    }
    if (!solutionToTest || solutionToTest.length === 0) {
        return Promise.reject({
            status: 400,
            msg: "400 Bad Request: Can't check the solution without the solution!",
        });
    }
    return new Promise((resolve, reject) => {
        const user_id = 123;
        const uniqueKey = `INPUT_TO_TEST${user_id}`;
        process.env[uniqueKey] = JSON.stringify(solutionToTest);
        //console.log(process.env.INPUT_TO_TEST, "<< INPUT_TO_TEST IN MODEL");
        let id;
        if (kata_id < 10) {
            id = `0${kata_id}`;
        }
        else {
            id = `${kata_id}`;
        }
        (0, child_process_1.exec)(`npm run test-prod ./kata-tests/${test_path} ${id} "${user_id}"`, (error, stdout, stderr) => {
            const consoleArr = stdout.split("new test:");
            const allLogs = [];
            // const usefulLogs: string[] = allLogs.slice(
            //   allLogs.indexOf("delete from here") + 1,
            //   allLogs.length
            // );
            consoleArr.shift();
            consoleArr.forEach((testsLogs) => {
                const innerArr = [];
                const stringedArr = testsLogs.split("\n");
                stringedArr.map((item) => {
                    if (item.slice(0, 11) != "      at db" &&
                        item.slice(0, 15) != "      at Object" &&
                        item.slice(0, 15) != "      at eval (" &&
                        item != "> test" &&
                        item.slice(0, 6) != "> jest" &&
                        item.slice(0, 9) != "> katatak" &&
                        item.slice(0, 12) != "> PGDATABASE" &&
                        item != "  console.log" &&
                        item.trim() != "") {
                        innerArr.push(item.trim());
                    }
                });
                allLogs.push(innerArr);
            });
            if (error) {
                const test_list = stderr.slice(stderr.indexOf(".js") + 5, stderr.indexOf(" ●"));
                const charBeforeTick = /(?=✓|✕)/g;
                const tests = test_list.split(charBeforeTick);
                tests.shift();
                let counter = 0;
                const testObjArr = tests.map((result) => {
                    const pass = result.includes("✓");
                    let description = "";
                    if (pass) {
                        description += result.split("✓").join("");
                    }
                    else {
                        description += result.split("✕").join("");
                    }
                    const testObj = {
                        pass: pass,
                        description: description,
                        logs: allLogs[counter],
                    };
                    counter++;
                    return testObj;
                });
                //
                const success = false;
                //clearTimeout(timer);
                resolve({
                    success: false,
                    //stderr: stderr,
                    //stdout: stdout,
                    test_results: testObjArr,
                    logs: allLogs,
                    posted_solution: false,
                });
            }
            else {
                //clearTimeout(timer);
                const test_list = stderr.slice(stderr.indexOf(".js") + 5, stderr.indexOf("Test Suites"));
                const charBeforeTick = /(?=✓|✕)/g;
                const tests = test_list.split(charBeforeTick);
                tests.shift();
                let counter = 0;
                const testObjArr = tests.map((result) => {
                    const pass = result.includes("✓");
                    let description = "";
                    if (pass) {
                        description += result.split("✓").join("");
                    }
                    else {
                        description += result.split("✕").join("");
                    }
                    const testObj = {
                        pass: pass,
                        description: description,
                        logs: allLogs[counter],
                    };
                    counter++;
                    return testObj;
                });
                resolve({
                    success: true,
                    //stderr: stderr,
                    //stdout: stdout,
                    test_results: testObjArr,
                    logs: allLogs,
                    posted_solution: false,
                });
            }
        });
    });
});
module.exports.insertSolutionToSolutions = (user_id, solutionToPost, kata_id) => __awaiter(void 0, void 0, void 0, function* () {
    const values = [user_id, kata_id, solutionToPost];
    const queryStr = `INSERT INTO solutions (user_id, kata_id, solution) VALUES ($1, $2, $3) RETURNING *;`;
    try {
        const { rows } = yield db.query(queryStr, values);
        return rows[0];
    }
    catch (err) {
        if (err.code === "23503") {
            return Promise.reject({
                status: 404,
                msg: "404 Not Found: Couldn't find a user with that ID.",
            });
        }
    }
});
