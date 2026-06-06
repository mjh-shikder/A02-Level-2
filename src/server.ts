import app from "./app";

const port = 5000

const main = () => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
}


main()