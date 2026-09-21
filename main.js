import { createServer } from "node:http";

let taskId = 1;
let db = {
    taskList: [],
};

const responseServer = (res, data) => {
    res.writeHead(data.status, {
        "content-type": "Application/json",
    });
    res.end(JSON.stringify(data));
};

const server = createServer((req, res) => {
    let response = {
        status: 200,
    };

    if (req.method === "GET" && req.url === "/api/tasks") {
        response.data = db.taskList;
        res.writeHead(response.status, {
            "content-type": "Application/json",
        });
        res.end(JSON.stringify(response));
        return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/tasks")) {
        const id = +req.url.split("/").pop();
        const task = db.taskList.find((res) => res.id === id);
        response.data = task;
        response.status = 201;
        res.writeHead(response.status, {
            "content-type": "Application/json",
        });
        res.end(JSON.stringify(response));
        return;
    }

    if (req.method === "POST" && req.url === "/api/tasks") {
        let body = "";
        req.on("data", (buffer) => {
            body += buffer.toString();
        });
        req.on("end", () => {
            const payload = JSON.parse(body);
            const task = {
                id: taskId++,
                title: payload.title,
                isCompleted: false,
            };
            response.data = task;
            response.status = 201;
            db.taskList.push(task);
            responseServer(res, response);
        });
        return;
    }

    if (req.method === "DELETE" && req.url.startsWith("/api/tasks")) {
        const id = +req.url.split("/").pop();
        const task = db.taskList.findIndex((task) => task.id === id);
        if (task !== -1) {
            const tasked = db.taskList.splice(task, 1)[0];
            response.status = 201;
            response.data = tasked;
        }
        responseServer(res, response);
        return;
    }

    if (req.method === "PUT" && req.url.startsWith("/api/tasks")) {
        let body = "";
        req.on("data", (buffet) => {
            body += buffet.toString();
        });
        req.on("end", () => {
            const id = +req.url.split("/").pop();
            const index = db.taskList.findIndex((task) => task.id === id);
            const payload = JSON.parse(body);
            const task = db.taskList[index];
            db.taskList[index] = {
                id: task.id,
                title: payload.title || task.title,
                isCompleted:
                    payload.isCompleted !== undefined
                        ? payload.isCompleted
                        : task.isCompleted,
            };
            response.status = 201;
            response.data = db.taskList[index];
            responseServer(res, response);
        });
        return;
    }
});

server.listen(3000, "127.0.0.1", () => {
    console.log("127.0.0.1");
});
