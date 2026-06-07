import app from "./app";
import config from "./config";
import { initDB } from "./db";
const port = config.port;
const main = async () => {
    try {
        await initDB();
        app.listen(port, () => {
            initDB();
            console.log(`Example app listening on port ${port}`);
        });
    }
    catch (error) {
        console.log(error);
    }
};
main();
//# sourceMappingURL=server.js.map