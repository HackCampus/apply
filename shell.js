const shell = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>HackCampus</title>
<link rel="stylesheet" src="/static/app.css" />
</head>
<body>
<script src="/static/app.js">
</script>
</body>
</html>
`

module.exports = (req, res) => res.send(shell)
