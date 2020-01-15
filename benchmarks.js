var DATA = {};

var DOIS = {
    "damouche-martel-chapoutot-fmics15": "10.1007/978-3-319-19458-5_3",
    "damouche-martel-chapoutot-nsv14": "10.1016/j.entcs.2015.10.006",
    "feron-ieee10": "10.1109/MCS.2010.938196",
    "damouche-martel-chapoutot-cf15": "10.1145/2742854.2742894",
    "abdelmalek-bit71": "10.1007/BF01939404",
    "darulova-kuncak-2014": "10.1145/2535838.2535874",
    "solovyev-et-al-2015": "10.1007/978-3-319-19249-9_33",
    "herbie-2015": "10.1145/2813885.2737959",
    "precimonious-2013": "10.1145/2503210.2503296",
    "rump-revisited-2002": "10.1023/A:1015569431383",
};

function Predicate() {
    this.f = function(x) { return true; };
}

Predicate.prototype.and = function(f) {
    var old_f = this.f;
    this.f = function(x) { return old_f(x) && f(x); };
    return this;
}

function Element(tagname, props, children) {
    if (!children) { children = props; props = {}; }

    var $elt = document.createElement(tagname);
    for (var i in props) if (props.hasOwnProperty(i)) $elt[i] = props[i];

    function addAll(c) {
        if (!c) return;
        else if (Array.isArray(c)) c.map(addAll);
        else if (typeof c == "string") $elt.appendChild(document.createTextNode(c))
        else $elt.appendChild(c);
    }
    addAll(children);
    return $elt;
}

function get_search() {
    var predicate = new Predicate();
    predicate.text = document.querySelector("#search").value;
    predicate.text.split(/\s+/g).forEach(function(word) {
        var field = ":name";
        var invert = false;

        if (word[0] == "!") {
            var invert = !invert;
            word = word.substr(1);
        }

        if (word.indexOf(":") !== -1) {
            field = word.substr(0, word.indexOf(":"));
            word = word.substr(word.indexOf(":") + 1);
            if (field == "domain") {
                field = ":fpbench-domain";
            } else if (field == "from") {
                field = ":cite";
            } else if (field == "operator") {
                field = "operators"
            } else if (["body", "arguments", "operators"].indexOf(field) == -1) {
                field = ":" + field;
            }
        }

        predicate.and(function(core) {
            var bool = core[field] && ("" + core[field]).toLowerCase().indexOf(word.toLowerCase()) !== -1;
            return invert ? !bool : bool;
        });
    });
    return predicate;
}

function render_datum(key, elt, value) {
    return Element("div", { className: "datum "+elt }, [
        Element("strong", key),
        Element(elt, value),
    ]);
}

function render_example(example) {
    var out = [];
    for (var i in example) {
        if (!example.hasOwnProperty(i)) continue;
        out.push(Element("code", { className: "label" }, i));
        out.push(" ");
        out.push(example[i]);
        out.push(", ");
    }
    out.pop();
    return out;
}

function render_arguments(args) {
    var out = [];
    for (var i = 0; i < args.length; i++) {
        out.push(Element("code", [args[i]]))
        out.push(", ");
    }
    out.pop();
    return out;
}

function render_cite(cite) {
    var out = [];
    for (var i = 0; i < cite.length; i++) {
        var elt = Element("a", [cite[i]]);
        if (DOIS[cite[i]]) {
            elt.href = "http://dx.doi.org/" + DOIS[cite[i]];
        }
        out.push(elt);
        out.push(", ");
    }
    out.pop();
    return out;
}

function extra_data(core) {
    var out = [];
    for (var i in core) {
        if (core.hasOwnProperty(i) &&
            i[0] == ":" &&
            [":name", ":description", ":precision",
             ":fpbench-domain", ":cite", ":pre", ":example"].indexOf(i) === -1) {
            out.push(render_datum(i.substr(1), "code", core[i]));
        }
    }
    return out;
}

function create_titanic_permalink(core) {
    return "http://titanic.uwplse.org/evaluate?core=" + encodeURIComponent(core.core) + "&float_override=false&posit_override=false";
}

function create_herbie_permalink(core) {
    return "http://herbie.uwplse.org/demo/improve?formula=" + encodeURIComponent(core.core);
}

function create_fptaylor_permalink(core) {
    return "http://fptaylor.cs.utah.edu/run?input=" + encodeURIComponent(core.core_fptaylor);
}

function render_result(core) {
    var more_link = Element("a", { className: "more" }, "more");
    var out = Element("div", [
        Element("h2", [ core[":name"] || "(unnamed)", more_link ]),
        core[":description"] && render_datum("Description", "p", core[":description"]),
        core[":example"] && render_datum("Example", "span", render_example(core[":example"])),

        render_datum("Arguments", "span", render_arguments(core.arguments)),
        core[":precision"] && render_datum("Precision", "span", core[":precision"]),
        core[":fpbench-domain"] && render_datum("Domain", "span", core[":fpbench-domain"][0].toUpperCase() + core[":fpbench-domain"].substr(1)),
        core[":cite"] && render_datum("From", "span", render_cite(core[":cite"])),

        core[":pre"] && render_datum("Precondition", "pre", core[":pre"]),
        render_datum("Body", "pre", core.body),

        extra_data(core),

        Element("div", { className: "links", }, [
            Element("strong", "External tools:"),
            Element("a", {
                href: create_titanic_permalink(core)
            }, "Titanic"),
            core.operators.indexOf("while") === -1 && Element("a", {
                href: create_herbie_permalink(core)
            }, "Herbie"),
            core.core_fptaylor && Element("a", {
                href: create_fptaylor_permalink(core)
            }, "FPTaylor"),
            // Leave this tool as the last one
            Element("a", {
                download: "benchmark.fpcore",
                href: "data:;base64," + btoa(core.core)
            }, "Download"),
        ]),
    ]);

    out.addEventListener("click", function() { out.classList.add("open"); more_link.textContent = "less" });
    more_link.addEventListener("click", function(e) {
        out.classList.toggle("open");
        e.stopPropagation();
        more_link.textContent = out.classList.contains("open") ? "less" : "more";
    });
    return out;
}

function render_results(evt) {
    var $out = document.querySelector("#benchmarks");
    var $all = document.querySelector("#download-all");
    var predicate = get_search();
    if (predicate.text) {
        history.replaceState(null, "", "#" + encodeURIComponent(predicate.text));
    } else {
        history.replaceState(null, "", location.href.substr(0, location.href.length - location.hash.length));
    }
    var subdata = DATA.filter(predicate.f);

    while ($out.children.length) $out.children[0].remove();
    subdata.map(render_result).forEach($out.appendChild.bind($out));

    document.querySelector("#num-found").textContent = subdata.length + " benchmarks";
    if (evt) evt.preventDefault();

    var all_benches = subdata.map(function(core) { return core.core; }).join("\n\n");
    $all.setAttribute("href", "data:;base64," + btoa(all_benches))
}

function load_benchmarks(data) {
    DATA = data;
    if (window.location.hash) {
        var s = decodeURIComponent(window.location.hash.substr(1));
        document.querySelector("#search").value = s;
    }
    render_results();
    document.querySelector("#search").addEventListener("change", render_results);
    document.querySelector("#benchmark-search").addEventListener("submit", render_results);
    document.querySelector("#overlay .help").addEventListener("click", function() {
        this.classList.toggle("active");
        document.querySelector("#help").classList.toggle("active");
    })
}
