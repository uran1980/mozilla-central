// |jit-test| error:InternalError

// Binary: cache/js-dbg-32-92fe907ddac8-linux
// Flags: -m -n
//
mjitChunkLimit(31)
o = {}
o.valueOf = function() {
    for (var p in undefined) {
        a = new Function;
    }
    +o;
};
+o;
