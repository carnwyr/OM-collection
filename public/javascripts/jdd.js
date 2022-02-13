(function($) {
    $.fn.jdd = function(blockLeftId, blockRightId) {
        diffs = [];
        let left = JSON.parse($(`#${blockLeftId}`).text());
        let right = JSON.parse($(`#${blockRightId}`).text());

        let config = createConfig();
        formatAndDecorate(config, left);
        $(`#${blockLeftId}`).text(config.out);

        let config2 = createConfig();
        formatAndDecorate(config2, right);
        $(`#${blockRightId}`).text(config2.out);

        config.currentPath = [];
        config2.currentPath = [];

        diffVal(left, config, right, config2);
        diffColor(diffs, blockLeftId, blockRightId);
        console.log(diffs);
    };
    let LEFT = 'left';
    let RIGHT = 'right';
    let EQUALITY = 'eq';
    let TYPE = 'type';
    let MISSING = 'missing';
    let diffs = [];
    let requestCount = 0;

    function createConfig() {
        return {
            out: '',
            indent: -1,
            currentPath: [],
            paths: [],
            line: 1
        };
    };

    function formatAndDecorate(config, data) {
        if (getType(data) === 'array') {
            formatAndDecorateArray(config, data);
            return;
        }

        startObject(config);
        config.currentPath.push('/');
        let props = getSortedProperties(data);
        props.forEach(function(key) {
            config.out += newLine(config) + getTabs(config.indent) + '"' + unescapeString(key) + '": ';
            config.currentPath.push(key);
            config.paths.push({
                path: generatePath(config),
                line: config.line
            });
            formatVal(data[key], config);
            config.currentPath.pop();
        });
        finishObject(config);
        config.currentPath.pop();
    };

    function getSortedProperties(obj) {
        let props = [];
        for (let prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                props.push(prop);
            }
        }
        props = props.sort(function(a, b) {
            return a.localeCompare(b);
        });
        return props;
    };

    function startObject(config) {
        config.indent++;
        config.out += '{';
        if (config.paths.length === 0) {
            config.paths.push({
                path: generatePath(config),
                line: config.line
            });
        }
        if (config.indent === 0) {
            config.indent++;
        }
    };

    function finishObject(config) {
        if (config.indent === 0) {
            config.indent--;
        }

        removeTrailingComma(config);

        config.indent--;
        config.out += newLine(config) + getTabs(config.indent) + '}';
        if (config.indent !== 0) {
            config.out += ',';
        } else {
            config.out += newLine(config);
        }
    };

    function newLine(config) {
        config.line++;
        return '<br>';
    };

    function getTabs(indent) {
        let s = '';
        for (let i = 0; i < indent; i++) {
            s += '&nbsp;&nbsp;';
        }
        return s;
    };

    function unescapeString(val) {
        if (val) {
            return val.replace('\\', '\\\\')
                .replace(/\"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace('\b', '\\b')
                .replace(/\f/g, '\\f')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
        } else {
            return val;
        }
    };

    function generatePath(config, prop) {
        let s = '';
        config.currentPath.forEach(function(path) {
            s += path;
        });

        if (prop) {
            s += '/' + prop;
        }

        if (s.length === 0) {
            return '/';
        } else {
            return s;
        }
    };

    function formatVal(val, config) {
        if (getType(val) === 'array') {
            config.out += '[';

            config.indent++;
            val.forEach(function(arrayVal, index) {
                config.out += newLine(config) + getTabs(config.indent);
                config.paths.push({
                    path: generatePath(config, '[' + index + ']'),
                    line: config.line
                });

                config.currentPath.push('/[' + index + ']');
                formatVal(arrayVal, config);
                config.currentPath.pop();
            });
            removeTrailingComma(config);
            config.indent--;

            config.out += newLine(config) + getTabs(config.indent) + ']' + ',';
        } else if (getType(val) === 'object') {
            formatAndDecorate(config, val);
        } else if (getType(val) === 'string') {
            config.out += '"' + unescapeString(val) + '",';
        } else if (getType(val) === 'number') {
            config.out += val + ',';
        } else if (getType(val) === 'boolean') {
            config.out += val + ',';
        } else if (getType(val) === 'null') {
            config.out += 'null,';
        }
    };

    function getType(value) {
        if ((function() {
                return value && (value !== this);
            }).call(value)) {
            return typeof value;
        }
        return ({}).toString.call(value).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
    };

    function removeTrailingComma(config) {
        if (config.out.charAt(config.out.length - 1) === ',') {
            config.out = config.out.substring(0, config.out.length - 1);
        }
    };

    function diffVal(val1, config1, val2, config2) {

        if (getType(val1) === 'array') {
            diffArray(val1, config1, val2, config2);
        } else if (getType(val1) === 'object') {
            if (['array', 'string', 'number', 'boolean', 'null'].indexOf(getType(val2)) > -1) {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'Both types should be objects', TYPE));
            } else {
                findDiffs(config1, val1, config2, val2);
            }
        } else if (getType(val1) === 'string') {
            if (getType(val2) !== 'string') {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'Both types should be strings', TYPE));
            } else if (val1 !== val2) {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'Both sides should be equal strings', EQUALITY));
            }
        } else if (getType(val1) === 'number') {
            if (getType(val2) !== 'number') {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'Both types should be numbers', TYPE));
            } else if (val1 !== val2) {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'Both sides should be equal numbers', EQUALITY));
            }
        } else if (getType(val1) === 'boolean') {
            diffBool(val1, config1, val2, config2);
        } else if (getType(val1) === 'null' && getType(val2) !== 'null') {
            diffs.push(generateDiff(config1, generatePath(config1),
                config2, generatePath(config2),
                'Both types should be nulls', TYPE));
        }
    };

    function diffArray(val1, config1, val2, config2) {
        if (getType(val2) !== 'array') {
            diffs.push(generateDiff(config1, generatePath(config1),
                config2, generatePath(config2),
                'Both types should be arrays', TYPE));
            return;
        }

        if (val1.length < val2.length) {
            for (let i = val1.length; i < val2.length; i++) {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2, '[' + i + ']'),
                    'Missing element <code>' + i + '</code> from the array on the left side', LEFT));
            }
        }
        val1.forEach(function(arrayVal, index) {
            if (val2.length <= index) {
                diffs.push(generateDiff(config1, generatePath(config1, '[' + index + ']'),
                    config2, generatePath(config2),
                    'Missing element <code>' + index + '</code> from the array on the right side', RIGHT));
            } else {
                config1.currentPath.push('/[' + index + ']');
                config2.currentPath.push('/[' + index + ']');

                if (getType(val2) === 'array') {
                    diffVal(val1[index], config1, val2[index], config2);
                }
                config1.currentPath.pop();
                config2.currentPath.pop();
            }
        });
    };

    function findDiffs(config1, data1, config2, data2) {
        config1.currentPath.push('/');
        config2.currentPath.push('/');
        let key;
        if (data1.length < data2.length) {
            for (key in data2) {
                if (data2.hasOwnProperty(key)) {
                    if (!data1.hasOwnProperty(key)) {
                        diffs.push(generateDiff(config1, generatePath(config1),
                            config2, generatePath(config2, '/' + key),
                            'The right side of this object has more items than the left side', MISSING));
                    }
                }
            }
        }
        for (key in data1) {
            if (data1.hasOwnProperty(key)) {
                config1.currentPath.push(key);
                if (!data2.hasOwnProperty(key)) {
                    diffs.push(generateDiff(config1, generatePath(config1),
                        config2, generatePath(config2),
                        'Missing property <code>' + key + '</code> from the object on the right side', RIGHT));
                } else {
                    config2.currentPath.push(key);

                    diffVal(data1[key], config1, data2[key], config2);
                    config2.currentPath.pop();
                }
                config1.currentPath.pop();
            }
        }
        config1.currentPath.pop();
        config2.currentPath.pop();
        for (key in data2) {
            if (data2.hasOwnProperty(key)) {
                if (!data1.hasOwnProperty(key)) {
                    diffs.push(generateDiff(config1, generatePath(config1),
                        config2, generatePath(config2, key),
                        'Missing property <code>' + key + '</code> from the object on the left side', LEFT));
                }
            }
        }
    };

    function generateDiff(config1, path1, config2, path2, msg, type) {
        if (path1 !== '/' && path1.charAt(path1.length - 1) === '/') {
            path1 = path1.substring(0, path1.length - 1);
        }
        if (path2 !== '/' && path2.charAt(path2.length - 1) === '/') {
            path2 = path2.substring(0, path2.length - 1);
        }
        let pathObj1 = config1.paths.find(function(path) {
            return path.path === path1;
        });
        let pathObj2 = config2.paths.find(function(path) {
            return path.path === path2;
        });

        if (!pathObj1) {
            throw 'Unable to find line number for (' + msg + '): ' + path1;
        }
        if (!pathObj2) {
            throw 'Unable to find line number for (' + msg + '): ' + path2;
        }
        return {
            path1: pathObj1,
            path2: pathObj2,
            type: type,
            msg: msg
        };
    };

    function diffBool (val1, config1, val2, config2) {
        if (getType(val2) !== 'boolean') {
            diffs.push(generateDiff(config1, generatePath(config1),
                config2, generatePath(config2),
                'Both types should be booleans', TYPE));
        } else if (val1 !== val2) {
            if (val1) {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'The left side is <code>true</code> and the right side is <code>false</code>', EQUALITY));
            } else {
                diffs.push(generateDiff(config1, generatePath(config1),
                    config2, generatePath(config2),
                    'The left side is <code>false</code> and the right side is <code>true</code>', EQUALITY));
            }
        }
    };

    function forEach(array, callback, scope) {
        for (let idx = 0; idx < array.length; idx++) {
            callback.call(scope, array[idx], idx, array);
        }
    }

    function diffColor(diffs, blockLeftId, blockRightId) {
        for (i = 0; i < diffs.length; i++) {
            let linesLeft = $(`#${blockLeftId}`).text().split('<br>');
            let textLeft = $(`#${blockLeftId}`).text();
            for (let j = 0; j < linesLeft.length; j++) {
                if (diffs[i]['path1']['line'] == j + 1 && diffs[i]['type'] == 'eq' || diffs[i]['type'] == 'type') {
                    $(`#${blockLeftId}`).text(textLeft.replace(linesLeft[j], `<span style="color:#e67e22;">${linesLeft[j]}</span>`));
                } else if (diffs[i]['path1']['line'] == j + 1 && diffs[i]['type'] == 'right') {
                    $(`#${blockLeftId}`).text(textLeft.replace(linesLeft[j], `<span style="color:#c0392b;">${linesLeft[j]}</span>`));
                }
            }

            let linesRight = $(`#${blockRightId}`).text().split('<br>');
            let textRight = $(`#${blockRightId}`).text();
            for (let j = 0; j < linesRight.length; j++) {
                if (diffs[i]['path2']['line'] == j + 1 && diffs[i]['type'] == 'eq') {
                    $(`#${blockRightId}`).text(textRight.replace(linesRight[j], `<span style="color:#e67e22;">${linesRight[j]}</span>`));
                }
                else if (diffs[i]['path2']['line'] == j + 1 && diffs[i]['type'] == 'left') {
                  $(`#${blockRightId}`).text(textRight.replace(linesRight[j], `<span style="color:#27ae60;">${linesRight[j]}</span>`));
                }
            }
        }
        $(`#${blockLeftId}`).html($(`#${blockLeftId}`).text());
        $(`#${blockRightId}`).html($(`#${blockRightId}`).text());
    };

    function formatAndDecorateArray(config, data) {
        startArray(config);
        data.forEach(function(arrayVal, index) {
            config.out += newLine(config) + getTabs(config.indent);
            config.paths.push({
                path: generatePath(config, '[' + index + ']'),
                line: config.line
            });
            config.currentPath.push('/[' + index + ']');
            formatVal(arrayVal, config);
            config.currentPath.pop();
        });
        finishArray(config);
        config.currentPath.pop();
    };

    function startArray(config) {
        config.indent++;
        config.out += '[';
        if (config.paths.length === 0) {
            config.paths.push({
                path: generatePath(config),
                line: config.line
            });
        }
        if (config.indent === 0) {
            config.indent++;
        }
    };

    function finishArray(config) {
        if (config.indent === 0) {
            config.indent--;
        }
        removeTrailingComma(config);
        config.indent--;
        config.out += newLine(config) + getTabs(config.indent) + ']';
        if (config.indent !== 0) {
            config.out += ',';
        } else {
            config.out += newLine(config);
        }
    };
})(jQuery);
