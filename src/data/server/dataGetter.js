class DataGetter {
    constructor() {
        this.dbpromise = sqlite.open(path, { Promise });
    }

    getServersArray() {
        this.dbPromise.then((db) => {
            db.all('SELECT id FROM servers').then((rows) => {
                let arr = []
                rows.forEach((row) => {
                    arr.push(row.id);
                });
                return arr;
            }).then((value) => {
                res.json(value);
            });
        });
    }

    getUsers(server) {
        dbPromise.then((db) => {
            return db.get('SELECT current FROM users WHERE id = ? ORDER BY insertionDate DESC LIMIT 1', server)
            .then((value) => {
                if (value !== undefined) {
                    return value.current;
                }
                else {
                    return undefined;
                }
            })
        })
    }

    getGraphs(server) {
        let traffic =  { time: [], in: [], out: [] };
        let server =  { time: [], cpu: [], mem: [] };
        return dbPromise.then((db) => {
            Promise.all([
                db.all('SELECT * FROM traffic WHERE id = ? ORDER BY insertionDate DESC LIMIT 20 ', server).then((rows) => {
                    rows.forEach((row) => {
                        traffic.out.push(row.outgoing);
                        traffic.in.push(row.ingoing);
                        traffic.time.push(new Date(row.insertionDate));
                    });
                }),
                db.all('SELECT * FROM cpu WHERE id = ? ORDER BY insertionDate DESC LIMIT 20',server).then((rows) => {
                    rows.forEach((row) => {
                        server.cpu.push(row.one * 100);
                        server.time.push(new Date(row.insertionDate));
                    });
                }),
                db.all('SELECT * FROM memory WHERE id = ? ORDER BY insertionDate DESC LIMIT 20', server).then((rows) => {
                    rows.forEach((row) => {
                        server.mem.push(row.memory * 100);
                    });
                })
            ]).then(() => {
                res.json({
                    traffic,
                    server
                });
            });
        });
    }
}