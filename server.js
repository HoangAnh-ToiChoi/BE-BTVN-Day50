import { createServer } from "node:http";

let taskId = 1;
let db = {
    taskList: [
        // { id: 1, title: "dọn nhà", isCompelete: false },
        // { id: 2, title: "Xây nhà", isCompelete: false },
        // { id: 3, title: "phá nhà", isCompelete: false },
    ],
};

const allowOrigins = [
    "http://localhost:5173",
    "https://HoangAnh-ToiChoi.github.io",
];

function responseFromServer(req, res, data) {
    const originHeader = req.headers?.origin;

    const allowOrigin = originHeader
        ? allowOrigins.find(
              (_origin) => _origin.toLowerCase() === originHeader.toLowerCase(),
          ) || "*"
        : "*";

    res.writeHead(data.status, {
        "Content-Type": "Application/json",
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });

    res.end(JSON.stringify(data));
}

const server = createServer((req, res) => {
    let response = {
        status: 200,
    };

    if (req.method === "OPTIONS") {
        responseFromServer(req, res, response);
        return;
    }

    if (req.method === "GET" && req.url === "/api/tasks") {
        response.data = db.taskList;
        responseFromServer(req, res, response);
        return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/tasks")) {
        const id = +req.url.split("/").pop();
        const task = db.taskList.find((res) => res.id === id);
        if (task) response.data = task;
        else {
            response.status = "404";
            response.message = "Value Not Found";
        }
        responseFromServer(req, res, response);
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
            db.taskList.push(task);

            response.status = "201";
            response.data = task;

            responseFromServer(req, res, response);
        });
        return;
    }

    if (req.method === "DELETE" && req.url.startsWith("/api/tasks")) {
        const id = +req.url.split("/").pop();
        const index = db.taskList.findIndex((res) => res.id === id);
        if (index !== -1) {
            const task = db.taskList.splice(index, 1)[0];
            response.status = "201";
            response.data = task;
        } else {
            response.status = "404";
            response.message = "Value Not Found";
        }
        responseFromServer(req, res, response);
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
            if (index !== -1) {
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
            } else {
                response.status = 404;
                response.message = "Value Not Found";
            }
            responseFromServer(req, res, response);
        });
        return;
    }

    if (req.url === "/" || req.url === "/health") {
        response.message = "Server is running!";
        responseFromServer(req, res, response);
        return;
    }

    const fullUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const queryParams = fullUrl.searchParams;
    const url = queryParams.get("url");

    if (!url) {
        response.status = 404;
        response.message = "Route Not Found";
        responseFromServer(req, res, response);
        return;
    }

    let body = "";
    req.on("data", (buffet) => {
        body += buffet.toString();
    });
    req.on("end", () => {
        const option = {
            method: req.method,
        };
        if (!["GET", "HEAD"].includes(req.method)) {
            option.body = body;
        }
        fetch(url, option)
            .then((data) => data.json())
            .then((result) =>
                responseFromServer(req, res, {
                    status: 200,
                    data: result?.data ?? result,
                }),
            )
            .catch((err) => {
                responseFromServer(req, res, {
                    status: 500,
                    message: err.message,
                });
            });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
