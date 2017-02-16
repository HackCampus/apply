module.exports = application =>
`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta property="og:url" content="https://hackcampus-apply.herokuapp.com" />
<meta property="og:title" content="HackCampus - ${application.firstName} ${application.lastName}" />
<meta property="og:description" content="We help the brightest students find software engineering internships at London's best startups. Apply now!" />
<meta property="description" content="We help the brightest students find software engineering internships at London's best startups. Apply now!" />
<meta property="og:image" content="https://hackcampus.github.io/images/cover-light.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1656" />
<meta property="og:image:height" content="628" />
<title>HackCampus</title>
<link rel="stylesheet" href="/static/common.css" />
<link rel="stylesheet" href="/static/profile/styles.css" />
<link href="https://fonts.googleapis.com/css?family=Roboto+Mono|Roboto" rel="stylesheet">
</head>
<body>
<script id="application" type="application/json">${JSON.stringify(application)}</script>
<div id="container"></div>
<script src="https://cdn.polyfill.io/v2/polyfill.min.js"></script>
<script src="/static/profile/index.js"></script>
<script>
(function(s,p,y,w,a,r,e){s['GoogleAnalyticsObject']=a;s[a]=s[a]||function(){
(s[a].q=s[a].q||[]).push(arguments)},s[a].l=1*new Date();r=p.createElement(y),
e=p.getElementsByTagName(y)[0];r.async=1;r.src=w;e.parentNode.insertBefore(r,e)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-88923602-2', 'auto');
ga('send', 'pageview');
</script>
</body>
</html>`
