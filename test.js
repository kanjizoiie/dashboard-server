function big() {
    function sub1() {
        var x = 7;
        console.log(x)
        sub2();
    }
    function sub2() {
        var y = x;
        console.log(y);
    }
    var x = 3;
    sub1();
}
big();