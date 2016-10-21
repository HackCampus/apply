const {html} = require('inu')

module.exports = html`
<div class="code-review">
<div id="gist41141105" class="gist">
<div class="gist-file">
<div class="gist-data">
<div class="js-gist-file-update-container js-task-list-container file-box">
<div id="file-codereview-js" class="file">
<div itemprop="text" class="blob-wrapper data type-javascript">
<table class="highlight tab-size js-file-line-container" data-tab-size="8">
<tbody><tr>
<td id="file-codereview-js-L1" class="blob-num js-line-number" data-line-number="1"></td>
<td id="file-codereview-js-LC1" class="blob-code blob-code-inner js-file-line"><span class="pl-c">// returns strings in short date format like "Dec 10, 2012"</span></td>
</tr>
<tr>
<td id="file-codereview-js-L2" class="blob-num js-line-number" data-line-number="2"></td>
<td id="file-codereview-js-LC2" class="blob-code blob-code-inner js-file-line">  <span class="pl-k">function</span> <span class="pl-en">convertDateToEnglishString</span>(<span class="pl-smi">x</span>, <span class="pl-smi">y</span>, <span class="pl-smi">z</span>)</td>
</tr>
<tr>
<td id="file-codereview-js-L3" class="blob-num js-line-number" data-line-number="3"></td>
<td id="file-codereview-js-LC3" class="blob-code blob-code-inner js-file-line">  {</td>
</tr>
<tr>
<td id="file-codereview-js-L4" class="blob-num js-line-number" data-line-number="4"></td>
<td id="file-codereview-js-LC4" class="blob-code blob-code-inner js-file-line">
</td>
</tr>
<tr>
<td id="file-codereview-js-L5" class="blob-num js-line-number" data-line-number="5"></td>
<td id="file-codereview-js-LC5" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">var</span> d <span class="pl-k">=</span> <span class="pl-s"><span class="pl-pds">"</span><span class="pl-pds">"</span></span>;</td>
</tr>
<tr>
<td id="file-codereview-js-L6" class="blob-num js-line-number" data-line-number="6"></td>
<td id="file-codereview-js-LC6" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">0</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L7" class="blob-num js-line-number" data-line-number="7"></td>
<td id="file-codereview-js-LC7" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Jan<span class="pl-pds">"</span></span>;</td>
</tr>
<tr>
<td id="file-codereview-js-L8" class="blob-num js-line-number" data-line-number="8"></td>
<td id="file-codereview-js-LC8" class="blob-code blob-code-inner js-file-line">    } <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">1</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L9" class="blob-num js-line-number" data-line-number="9"></td>
<td id="file-codereview-js-LC9" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Feb<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L10" class="blob-num js-line-number" data-line-number="10"></td>
<td id="file-codereview-js-LC10" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L11" class="blob-num js-line-number" data-line-number="11"></td>
<td id="file-codereview-js-LC11" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">2</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L12" class="blob-num js-line-number" data-line-number="12"></td>
<td id="file-codereview-js-LC12" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Mar<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L13" class="blob-num js-line-number" data-line-number="13"></td>
<td id="file-codereview-js-LC13" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L14" class="blob-num js-line-number" data-line-number="14"></td>
<td id="file-codereview-js-LC14" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">3</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L15" class="blob-num js-line-number" data-line-number="15"></td>
<td id="file-codereview-js-LC15" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Apr<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L16" class="blob-num js-line-number" data-line-number="16"></td>
<td id="file-codereview-js-LC16" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L17" class="blob-num js-line-number" data-line-number="17"></td>
<td id="file-codereview-js-LC17" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">4</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L18" class="blob-num js-line-number" data-line-number="18"></td>
<td id="file-codereview-js-LC18" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>May<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L19" class="blob-num js-line-number" data-line-number="19"></td>
<td id="file-codereview-js-LC19" class="blob-code blob-code-inner js-file-line">    } <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">5</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L20" class="blob-num js-line-number" data-line-number="20"></td>
<td id="file-codereview-js-LC20" class="blob-code blob-code-inner js-file-line">       d <span class="pl-k">+=</span> <span class="pl-s"><span class="pl-pds">"</span>June<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L21" class="blob-num js-line-number" data-line-number="21"></td>
<td id="file-codereview-js-LC21" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L22" class="blob-num js-line-number" data-line-number="22"></td>
<td id="file-codereview-js-LC22" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> ( y <span class="pl-k">==</span> <span class="pl-c1">6</span>)</td>
</tr>
<tr>
<td id="file-codereview-js-L23" class="blob-num js-line-number" data-line-number="23"></td>
<td id="file-codereview-js-LC23" class="blob-code blob-code-inner js-file-line">    {</td>
</tr>
<tr>
<td id="file-codereview-js-L24" class="blob-num js-line-number" data-line-number="24"></td>
<td id="file-codereview-js-LC24" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Jul<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L25" class="blob-num js-line-number" data-line-number="25"></td>
<td id="file-codereview-js-LC25" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L26" class="blob-num js-line-number" data-line-number="26"></td>
<td id="file-codereview-js-LC26" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">7</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L27" class="blob-num js-line-number" data-line-number="27"></td>
<td id="file-codereview-js-LC27" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Aug<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L28" class="blob-num js-line-number" data-line-number="28"></td>
<td id="file-codereview-js-LC28" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L29" class="blob-num js-line-number" data-line-number="29"></td>
<td id="file-codereview-js-LC29" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">8</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L30" class="blob-num js-line-number" data-line-number="30"></td>
<td id="file-codereview-js-LC30" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Sep<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L31" class="blob-num js-line-number" data-line-number="31"></td>
<td id="file-codereview-js-LC31" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L32" class="blob-num js-line-number" data-line-number="32"></td>
<td id="file-codereview-js-LC32" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">9</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L33" class="blob-num js-line-number" data-line-number="33"></td>
<td id="file-codereview-js-LC33" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Oct<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L34" class="blob-num js-line-number" data-line-number="34"></td>
<td id="file-codereview-js-LC34" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L35" class="blob-num js-line-number" data-line-number="35"></td>
<td id="file-codereview-js-LC35" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">10</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L36" class="blob-num js-line-number" data-line-number="36"></td>
<td id="file-codereview-js-LC36" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Nov<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L37" class="blob-num js-line-number" data-line-number="37"></td>
<td id="file-codereview-js-LC37" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L38" class="blob-num js-line-number" data-line-number="38"></td>
<td id="file-codereview-js-LC38" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">else</span> <span class="pl-k">if</span> (y <span class="pl-k">==</span> <span class="pl-c1">11</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L39" class="blob-num js-line-number" data-line-number="39"></td>
<td id="file-codereview-js-LC39" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">=</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>Dec<span class="pl-pds">"</span></span></td>
</tr>
<tr>
<td id="file-codereview-js-L40" class="blob-num js-line-number" data-line-number="40"></td>
<td id="file-codereview-js-LC40" class="blob-code blob-code-inner js-file-line">    } <span class="pl-k">else</span> <span class="pl-en">alert</span>(<span class="pl-s"><span class="pl-pds">"</span>error!<span class="pl-pds">"</span></span>);</td>
</tr>
<tr>
<td id="file-codereview-js-L41" class="blob-num js-line-number" data-line-number="41"></td>
<td id="file-codereview-js-LC41" class="blob-code blob-code-inner js-file-line">
</td>
</tr>
<tr>
<td id="file-codereview-js-L42" class="blob-num js-line-number" data-line-number="42"></td>
<td id="file-codereview-js-LC42" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">if</span> (z <span class="pl-k">${'\x3C'}</span> <span class="pl-c1">10</span>) {</td>
</tr>
<tr>
<td id="file-codereview-js-L43" class="blob-num js-line-number" data-line-number="43"></td>
<td id="file-codereview-js-LC43" class="blob-code blob-code-inner js-file-line">      <span class="pl-c">// Add 0 to day</span></td>
</tr>
<tr>
<td id="file-codereview-js-L44" class="blob-num js-line-number" data-line-number="44"></td>
<td id="file-codereview-js-LC44" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">+=</span> <span class="pl-s"><span class="pl-pds">"</span> 0<span class="pl-pds">"</span></span> <span class="pl-k">+</span> z;</td>
</tr>
<tr>
<td id="file-codereview-js-L45" class="blob-num js-line-number" data-line-number="45"></td>
<td id="file-codereview-js-LC45" class="blob-code blob-code-inner js-file-line">    } <span class="pl-k">else</span> {</td>
</tr>
<tr>
<td id="file-codereview-js-L46" class="blob-num js-line-number" data-line-number="46"></td>
<td id="file-codereview-js-LC46" class="blob-code blob-code-inner js-file-line">      d <span class="pl-k">+=</span> <span class="pl-s"><span class="pl-pds">"</span> <span class="pl-pds">"</span></span> <span class="pl-k">+</span> z;</td>
</tr>
<tr>
<td id="file-codereview-js-L47" class="blob-num js-line-number" data-line-number="47"></td>
<td id="file-codereview-js-LC47" class="blob-code blob-code-inner js-file-line">    }</td>
</tr>
<tr>
<td id="file-codereview-js-L48" class="blob-num js-line-number" data-line-number="48"></td>
<td id="file-codereview-js-LC48" class="blob-code blob-code-inner js-file-line">
</td>
</tr>
<tr>
<td id="file-codereview-js-L49" class="blob-num js-line-number" data-line-number="49"></td>
<td id="file-codereview-js-LC49" class="blob-code blob-code-inner js-file-line">
</td>
</tr>
<tr>
<td id="file-codereview-js-L50" class="blob-num js-line-number" data-line-number="50"></td>
<td id="file-codereview-js-LC50" class="blob-code blob-code-inner js-file-line">    <span class="pl-k">return</span> d <span class="pl-k">+</span> <span class="pl-s"><span class="pl-pds">"</span>, <span class="pl-pds">"</span></span> <span class="pl-k">+</span> x;</td>
</tr>
<tr>
<td id="file-codereview-js-L51" class="blob-num js-line-number" data-line-number="51"></td>
<td id="file-codereview-js-LC51" class="blob-code blob-code-inner js-file-line">  }</td>
</tr>
</tbody></table>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
`
