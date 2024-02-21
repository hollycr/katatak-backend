import { exec } from "child_process";
const format = require("pg-format");
const { db } = require("../../db/connection");
const kill = require("tree-kill");

module.exports.insertSolutionToTests = async (
  user_id: number,
  solutionToTest: string,
  kata_id: number,
  test_path: string
) => {
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
    // const timer: any = setTimeout(() => {
    //   clearTimeout(timer);
    //   // kill(childProcessObj.pid);
    //   reject({
    //     status: 408,
    //     msg: "408: Request timeout - check for an infinite loop..",
    //   });
    //   // console.log(childProcessObj.pid, "<< childProcess pid");
    //   //exec(`kill -9 ${childProcessObj.pid}`);

    //   // exec(`kill -9 ${childProcessObj.pid}`, (error, stdout, stderr) => {
    //   //   reject({
    //   //     status: 408,
    //   //     msg: "408: Request timeout - check for an infinite loop..",
    //   //   });
    //   // });
    // }, 9000);

    exec(
      `npm run test ${test_path} ${kata_id} "${solutionToTest}"`,

      (error, stdout: string, stderr: string) => {
        const consoleArr: string[] = stdout.split("\n");
        const allLogs: string[] = [];
        consoleArr.map((item) => {
          if (
            item.slice(0, 11) != "      at db" &&
            item.slice(0, 15) != "      at eval (" &&
            item != "> test" &&
            item.slice(0, 6) != "> jest" &&
            item.slice(0, 9) != "> katatak" &&
            item.slice(0, 12) != "> PGDATABASE" &&
            item != "  console.log" &&
            item != ""
          ) {
            allLogs.push(item.trim());
          }
        });
        const usefulLogs: string[] = allLogs.slice(
          allLogs.indexOf("delete from here") + 1,
          allLogs.length
        );
        if (error) {
          // console.log(error, "<< error in model");
          // console.log(stdout, "<< stdout");
          // console.log(stderr, "<< stderr");
          const test_list = stderr.slice(
            stderr.indexOf(".js") + 5,
            stderr.indexOf(" ●")
          );
          const success: boolean = false;
          //clearTimeout(timer);
          resolve({
            success: false,
            stderr: stderr,
            stdout: stdout,
            test_results: test_list,
            logs: usefulLogs,
            posted_solution: false,
          });
        } else {
          //clearTimeout(timer);
          const test_list: string = stderr.slice(
            stderr.indexOf(".js") + 5,
            stderr.indexOf("Test Suites")
          );
          resolve({
            success: true,
            stderr: stderr,
            stdout: stdout,
            test_results: test_list,
            logs: usefulLogs,
            posted_solution: false,
          });
        }
      }
    );
  });
};

module.exports.insertSolutionToSolutions = async (
  user_id: number,
  solutionToPost: string,
  kata_id: number
) => {
  const values: (string | number)[] = [user_id, kata_id, solutionToPost];
  const queryStr = `INSERT INTO solutions (user_id, kata_id, solution) VALUES ($1, $2, $3) RETURNING *;`;
  try {
    const { rows } = await db.query(queryStr, values);
    return rows[0];
  } catch (err: any) {
    if (err.code === "23503") {
      return Promise.reject({
        status: 404,
        msg: "404 Not Found: Couldn't find a user with that ID.",
      });
    }
  }
};
