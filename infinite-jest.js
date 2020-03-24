// Dimensions.
const DIMENSIONS = getWindowDimensions();
const WIDTH = DIMENSIONS.width;
const HEIGHT = DIMENSIONS.height - 100;

// Padding.
const INSETS = {'left': 200, 'right': 200, 'top': 0, 'bottom': 60};

// Tick length.
const TICK_LENGTH = 7;

// Max label length.
const MAX_LABEL_LENGTH = 35;

// Radius highlight factor.
const RADIUS_HIGHLIGHT_FACTOR = 1.5;

// Years.
const YEARS = [
    "(unspecified)",
    "1960",
    "1963",
    "Year of the Whopper",
    "Year of the Tucks Medicated Pad",
    "Year of the Trial-Size Dove Bar",
    "Year of the Perdue Wonderchicken",
    "Year of the Whisper-Quiet Maytag Dishmaster",
    "Year of the Yushityu 2007 Mimetic-Resolution-Cartridge-View-Motherboard-Easy-To-Install-Upgrade For Infernatron/InterLace TP Systems For Home, Office, Or Mobile (sic)",
    "Year of Dairy Products from the American Heartland",
    "Year of the Depend Adult Undergarment",
    "Year of Glad"
];

// Months.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CHARACTERS = {
    'INCANDENZA FAMILY': [
        'Avril Incandenza',
        'Hal Incandenza',
        'James Orin Incandenza',
        'Orin Incandenza',
        'Mario Incandenza'
    ],

    'ENFIELD TENNIS ACADEMY': [
        'Ann Kittenplan',
        'Aubrey DeLint',
        'Charles Tavis',
        'Clenette Henderson',
        'Eliot Kornspan',
        'Evan Ingersoll',
        'Gerhardt Schtitt',
        'Graham Rader',
        'Idris Arslanian',
        'J. J. Penn',
        'Jim Struck Jr.',
        'Jim Troeltsch',
        'John "No Relation" Wayne',
        'Josh Gopnik',
        'Keiran McKenna',
        'Keith "The Viking" Freer',
        'Kent Blott',
        'LaMont Chu',
        'Lyle',
        'Marlon Bain',
        'Mary Esther Thode',
        'Michael Pemulis',
        'Ortho "The Darkness" Stice',
        'Otis P. Lord',
        'Ted Schacht',
        'Timmy "Sleepy TP" Peterson',
        'Tiny Ewell',
        'Todd "Postal Weight" Poselthwaite',
        'Trevor "The Axehandle" Axford',
        '"Lateral" Alice Moore',
        '"USS" Millicent Kent'
    ],

    'ENNET HOUSE': [
        'Bruce Green',
        'Charlotte Treat',
        'Don Gately',
        'Geoffrey Day',
        'Joelle Van Dyne',
        'Kate Gompert',
        'Ken Erdedy',
        'Pat Montesian',
        'Randy Lenz',
        'Ruth van Cleve'
    ],

    'OTHER': [
        'Hugh/Helen Steeply',
        'M. Fortier',
        'Madame Psychosis',
        'Matty Pemulis',
        'Medical Attache',
        'Mildred Bonk',
        'Molly Nitkin',
        'Poor Tony Krause',
        'Remy Marathe',
        'Rodney Tine Jr.',
        'Rodney Tine Sr.',
        'Wardine']
};

// Chapters.
var chapters = [];

// Characters.
var characters = [];

// Maps characters to their categories.
var categoryMap = {};

// Legend entries.
var legendEntries = [];

// Scales.
var scales = [];

// Circle glyph sets.
var sceneCircles;
var legendText;

// Scene glyph radius.
var radius;

// Visualize when document has loaded.
window.onload = function() {

    // Read the data set.
    d3.csv("./infinite-jest.csv", function(d) {

        visualize(parseData(d));
    });
};

// Process the data set.
function parseData(data) {

    // Calendar values.
    var year = 2004;
    var daysPerYear = 366.0;
    var mSecPerDay = 86400000;
    var undefDay = 0;
    var jan1st = new Date(year, 0, 1);

    // Create year map.
    var yearMap = {};
    for (var i = 0;
         i < YEARS.length;
         i++) {
        yearMap[YEARS[i]] = i;
    }

    // Create character array.
    var cat = 0;
    for (var group in CHARACTERS) {

        // Append to characters list.
        var groupCharacters = CHARACTERS[group];
        characters.push.apply(characters, groupCharacters);

        // Add legend entries.
        legendEntries.push(null);
        legendEntries.push(group);
        legendEntries.push.apply(legendEntries, groupCharacters);

        // Build categories map.
        categoryMap[group] = cat;
        for (var g = 0; g < groupCharacters.length; g++) {

            var character = groupCharacters[g];
            categoryMap[character] = cat;
        }

        cat++;
    }

    // Initialize chapter index.
    var chapter = {"index": 0};

    // Process each row.
    for (var r = 0;
         r < data.length;
         r++) {

        var row = data[r];

        // Process each column.
        for (var prop in row) {

            // Parse numbers.
            var value = row[prop].trim();
            if (!isNaN(value) && value.length > 0) {
                row[prop] = parseFloat(value);
            }
        }

        // Look up year.
        if (row.Year in yearMap) {
            row.YearNumber = yearMap[row.Year];
        }

        // Day of year.
        var doy = row.MonthDay.split('/', 2);
        row.DayOfYear =
            (doy.length == 2 ? Math.ceil((new Date(year, doy[0] - 1, doy[1]) - jan1st) / mSecPerDay) : undefDay)
                / (daysPerYear - 1);
        if (row.DayName.length == 0 && doy.length == 2) {
            row.DayName = MONTHS[doy[0] - 1] + " " + doy[1];
        }

        // Chapter bounds.
        if (row.Chapter != chapter.index) {
            chapter = {"index": row.Chapter, "start": row.Scene, "end": row.Scene};
            chapters.push(chapter);
        }
        else {
            chapter.end = row.Scene;
        }

        // Characters.
        row.present = row.CharactersPresent.split(';');
        if (row.present.length == 1 && row.present[0].length == 0) {
            row.present = [];
        }

        // Check characters are known.
//        for (var j = 0; j < row.present.length; j++) {
//
//            if (characters.indexOf(row.present[j]) < 0) {
//
//                console.log("Unknown character " + row.present[j]);
//            }
//        }
    }

    return data;
}

// Create the visualization.
function visualize(data) {

    // Scene range.
    var sceneMin = d3.min(data,
        function(d) {
            return d.Scene;
        });
    var sceneMax = d3.max(data,
        function(d) {
            return d.Scene;
        });

    // Radius.
    radius = (WIDTH - INSETS.left - INSETS.right) / (sceneMax - sceneMin) / 2;

    // Calculate scales.
    scales.scenes = d3.scale.linear()
        .domain([sceneMin, sceneMax])
        .range([INSETS.left + radius, WIDTH - INSETS.right - radius]);

    scales.years = d3.scale.linear()
        .domain([0, YEARS.length])
        .range([HEIGHT - INSETS.bottom - radius, radius + INSETS.top]);

    scales.legend = d3.scale.linear()
        .domain([0, legendEntries.length - 1])
        .range([radius + INSETS.top, HEIGHT - INSETS.bottom - radius]);

    scales.categories = d3.scale.category10();

    // Root panel.
    var vis = d3.select("#chart")
        .append("svg:svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT);

    // Year tick-lines.
    vis.selectAll("line.year")
        .data(scales.years.ticks(YEARS.length))
        .enter()
        .append("svg:line")
        .attr("class", "tickLine year")
        .attr("x1", scales.scenes(sceneMin))
        .attr("x2", scales.scenes(sceneMax))
        .attr("y1", function (d) {
            return scales.years(d);
        })
        .attr("y2", function (d) {
            return scales.years(d);
        })
        .style("visibility", function(d) {
            var label = YEARS[d];
            return isUndefined(label) ? "hidden" : "visible";
        });

    // Year tick labels.
    vis.selectAll("text.rule.year")
        .data(scales.years.ticks(YEARS.length))
        .enter()
        .append("svg:text")
        .attr("class", "rule year")
        .attr("x", INSETS.left)
        .attr("y", function (d) {
            return scales.years(d);
        })
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d) {
            var label = YEARS[d];
            var len = typeof label === 'undefined' ? 0 : label.length;
            if (len > MAX_LABEL_LENGTH + 5) {
                var delLen = len - MAX_LABEL_LENGTH;
                label = label.replace(label.substring((len - delLen) / 2, (len + delLen) / 2), " ... ");
            }
            return typeof label === 'undefined' ? "" : label;
        });

    // Chapter ticks.
    vis.selectAll("line.chapter")
        .data(chapters)
        .enter()
        .append("svg:line")
        .attr("class", "tickLine chapter")
        .attr("x1", function(d) {
            return scales.scenes(d.start);
        })
        .attr("x2", function(d) {
            return scales.scenes(d.start);
        })
        .attr("y2", function () {
            return scales.years(0);
        })
        .attr("y1", function (d, i) {
            return scales.years(0) + (isMajorChapterTickMark(i) ? 2.0 * TICK_LENGTH : TICK_LENGTH);
        });

    // Chapter tick labels.
    vis.selectAll("text.rule.chapter")
        .data(chapters)
        .enter()
        .append("svg:text")
        .attr("class", "rule chapter")
        .attr("x", function(d) {
            return scales.scenes(d.start);
        })
        .attr("y", function () {
            return HEIGHT;
        })
        .attr("dy", "-4.0em")
        .attr("text-anchor", "middle")
        .text(function(d, i) {
            return isMajorChapterTickMark(i) ? "Ch. " + d.index : null;
        });

    // Scene circles.
    sceneCircles = vis.selectAll("circle")
        .data(data)
        .enter()
        .append("svg:circle")
        .attr("cy", function(d) {
            return scales.years(d.YearNumber + d.DayOfYear);
        })
        .attr("cx", function(d) {
            return scales.scenes(d.Scene);
        })
        .attr("r", radius)
        .on("mouseover", function(d) {
            showInfoBox(d);
            highlight(this, d.present.length > 0 ? scales.categories(categoryMap[d.present[0]]) : null);
            highlightLegend(d.present)
        })
        .on("mouseout", function() {
            hideInfoBox();
            unHighlight()
        });

    // Character legend.
    var legendX = WIDTH - INSETS.right + radius;
    legendText = vis.selectAll("text.character")
        .data(legendEntries)
        .enter()
        .append("svg:text")
        .attr("x", legendX)
        .attr("dx", "0.35em")
        .attr("dy", "0.35em")
        .attr("y", function (d, i) {
            return scales.legend(i);
        })
        .text(function(d) {
            return d;
        })
        .on("mouseover", function(d) {
            var chars = d in CHARACTERS ? CHARACTERS[d] : [];
            chars.push(d);
            highlightLegend(chars);
            highlightScenes(chars);
        })
        .on("mouseout", function() {
            unHighlight();
        });
}

// Highlight characters in the legend
function highlightLegend(characters) {

    // List of nodes to highlight.
    var highlights = [];
    legendText
        .each(function(d) {

        if (characters.indexOf(d) >= 0) {
            highlights.push(this);
        }
    });

    // Apply highlighting.
    d3.selectAll(highlights)
        .style("fill", function(d) {

            return scales.categories(categoryMap[d]);
        })
        .attr("class", function() {

            return "highlight";
        });
}

// Highlight character in the scenes.
function highlightScenes(characters) {

    // List of nodes to highlight.
    var highlights = [];
    sceneCircles
        .each(function(d) {

        var present = false;
        for (var c = 0; !present && c < characters.length; c++) {

            present = d.present.indexOf(characters[c]) >= 0;
        }

        if (present) {
            highlights.push(this);
        }
    });

    // Apply highlighting.
    d3.selectAll(highlights)
        .style("fill", function() {

            return  scales.categories(categoryMap[characters[0]]);
        })
        .attr("r", function() {

            return  radius * RADIUS_HIGHLIGHT_FACTOR;
        })
        .attr("class", function() {

            return  "highlight";
        });
}

// Highlight an element.
function highlight(obj, color) {

    d3.select(obj)
        .attr("r", radius * RADIUS_HIGHLIGHT_FACTOR)
        .attr("class", "highlight")
        .style("fill", color);
}

// Remove highlights.
function unHighlight() {

    legendText
        .attr("class", "")
        .style("fill", null);

    sceneCircles
        .attr("r", radius)
        .attr("class", "")
        .style("fill", null);
}

// Display the info box.
function showInfoBox(d) {

    // Create text strings.
    var date = (d.DayName.length > 0 ? (d.DayName + ", ") : "") + d.Year;

    // Display the box.
    d3.select("#infobox")
        .attr("class", "text")
        .style('left', INSETS.left + "px")
        .style('top', HEIGHT + "px")
        .style('width', (WIDTH - INSETS.left - INSETS.right) + "px")
        .style('display', 'inline')
        .html("Ch. " + d.Chapter + " (scene " + d.Scene + "; page " + d.Page + ") &mdash; " + date + "<br/>"
        + "<blockquote>" + d.Synopsis + "</blockquote>");
}

// Hide the info box.
function hideInfoBox() {

    d3.select("#infobox")
        .style('display', 'none');
}

// Is this a major tick mark?
function isMajorChapterTickMark(i) {

    // Is first, last or divisible by five.
    return i == 0 || i + 1 == chapters.length || (i + 1) % 5 == 0;
}

// Tests whether a value is defined.
function isUndefined(value) {

    return typeof value === 'undefined';
}

// Gets the window dimensions.
function getWindowDimensions() {

    var width = 630;
    var height = 460;
    if (document.body && document.body.offsetWidth) {

        width = document.body.offsetWidth;
        height = document.body.offsetHeight;
    }

    if (document.compatMode == 'CSS1Compat' && document.documentElement && document.documentElement.offsetWidth) {

        width = document.documentElement.offsetWidth;
        height = document.documentElement.offsetHeight;
    }

    if (window.innerWidth && window.innerHeight) {

        width = window.innerWidth;
        height = window.innerHeight;
    }

    return {'width': width, 'height': height};
}
