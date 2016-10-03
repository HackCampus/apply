const shell = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HackCampus</title>
<link rel="stylesheet" href="/static/app.css" />
<link href="https://fonts.googleapis.com/css?family=Roboto+Mono" rel="stylesheet">
</head>
<body>
<div id="container"></div>
<script src="/static/app.js"></script>
</body>
</html>
`

module.exports = (req, res) => res.send(shell)
