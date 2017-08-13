function startApp() {
    // Config
    const appKey = 'kid_Hk4SphWPW';
    const appSecret = '79d2e076e0f74ebbb708f37cda5868cc';
    const baseUrl = 'https://baas.kinvey.com';

    // Process
    homeView();

    /**
     * Bind events
     */
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show();
            $("button, input[type='button']").prop('disabled', true);
        },
        ajaxStop: function () {
            $("#loadingBox").hide();
            $("button, input[type='button']").prop('disabled', false);
        }
    });

    $("#loadingBox, #infoBox, #errorBox").click(function () {
        $(this).hide();
    });

    $("#linkHome").click(homeView);
    $("#linkLogin").click(loginView);
    $("#linkRegister").click(registrationView);
    $("#linkLogout").click(logout);
    $("#linkListAds").click(listAdsView);
    $("#linkCreateAd").click(createAdView);

    $("#viewCreateAd").find('#buttonCreateAd').click(createAd);
    $("#viewRegister").find('#buttonRegisterUser').click(register);
    $("#viewLogin").find('#buttonLoginUser').click(login);


    function homeView() {
        showView("viewHome");
    }

    function loginView() {
        $('#formLogin').trigger('reset');
        showView("viewLogin");
    }

    function registrationView() {
        $('#formRegister').trigger('reset');
        showView("viewRegister");
    }

    function listAdsView() {
        showView('viewAds');
        listAds();
    }

    function createAdView() {
        $('#formCreateAd').trigger('reset');
        showView('viewCreateAd');
    }

    function editAdView() {
        showView('viewEditAd');
    }

    function hideLinkHeader() {
        $("#linkHome").show();
        $("#menu").find("#linkHome").show();
        if (sessionStorage.getItem('authToken')) {
            $("#linkLogout").show();
            $("#linkListAds").show();
            $("#linkCreateAd").show();
            $("#linkLogin").hide();
            $("#linkRegister").hide();
        } else {
            $("#linkLogout").hide();
            $("#linkListAds").hide();
            $("#linkCreateAd").hide();
            $("#linkLogin").show();
            $("#linkRegister").show();
        }
    }

    function showView(view) {
        setGreeting();
        hideLinkHeader();
        $("main > section").hide();
        $("#" + view).show();
    }


    function saveSessionStorage(data) {
        sessionStorage.setItem('userName', data.username);
        sessionStorage.setItem('userId', data._id);
        sessionStorage.setItem('authToken', data._kmd.authtoken);
    }

    function readMoreView(ad) {
        showView('viewReadMore');
        readMore(ad);
        function readMore(ad) {
            $('#viewReadMore').find('.readMore').text('');

            $(".imgContent").append(`<img src="${ad.img}">`);
            $("#readMoreTitle").text(ad.title);
            $("#readMoreDescription").text(ad.description);
            $("#readMorePublisher").text(ad.publisher);
            $("#readMoreDate").text(ad.date);
        }
    }

    function listAds() {
        let contentTable = $("#ads");
        contentTable.text("");

        $.ajax({
            url: baseUrl + '/appdata/' + appKey + '/prodavachnik/',
            method: 'GET',
            headers: {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
            },
            success: successListAds,
            error: handleError
        });

        function successListAds(data) {
            contentTable.text("");
            let table = $('<table>').append(` <tr>
                    <th>Title</th>
                    <th>Publisher</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Date Published</th>
                    <th>Actions</th>
                </tr>`);
            for (let ad of data) {
                let buttons = [];
                let readMore = $("<button>Read More</button>")
                    .click(() => readMoreView(ad));
                buttons.push(readMore);
                if (ad._acl.creator === sessionStorage.getItem('userId')) {
                    let del = $("<button>&#x2718;</button>").click(() => deleteAd(ad));
                    let edit = $("<button>&#9998;</button>").click(() => makeEditAdView(ad));

                    buttons.push(" ", del, " ", edit);
                }
                let tr = $('<tr>')
                    .append($(`<td>${ad.title}</td>`))
                    .append($(`<td>${ad.publisher}</td>`))
                    .append($(`<td>${ad.description}</td>`))
                    .append($(`<td>${Number(ad.price).toFixed(2)}</td>`))
                    .append($(`<td>${ad.date}</td>`))
                    .append($(`<td>`).append(buttons));
                table.append(tr);
            }
            contentTable.append(table);
        }
    }

    function deleteAd(ad) {

        $.ajax({
            url: baseUrl + '/appdata/' + appKey + '/prodavachnik/' + ad._id,
            method: 'DELETE',
            headers: {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
                'Content-Type': 'application/json'
            },
            success: successDeleteAd,
            error: handleError
        });
        function successDeleteAd() {
            listAdsView();
            showInfo("Deleted ad success!");
        }
    }

    function createAd() {
        let createForm = $("#formCreateAd");
        let date = ( "0" + parseInt(new Date().getMonth() + 1)).slice(-2) + "/"
            + ("0" + new Date().getDate()).slice(-2) + "/" + new Date().getFullYear();
        let publisher = sessionStorage.getItem('userName');
        let description = createForm.find('[name="description"]').val();
        let title = createForm.find('[name="title"]').val();
        let img = createForm.find('[name="image"]').val();
        let price = createForm.find('[name="price"]').val();

        let curAd = {
            title,
            publisher,
            description,
            img,
            price,
            date
        };

        if (title.length == 0) {
            showError("Title cannot be empty!");
            return;
        }
        if (price.length == 0) {
            showError("Price cannot be empty!");
            return;
        }

        $.ajax({
            url: baseUrl + '/appdata/' + appKey + "/prodavachnik",
            method: 'POST',
            headers: {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(curAd),
            success: successCreateAd,
            error: handleError
        });
        function successCreateAd() {
            listAdsView();
            showInfo('Success created ad!');
        }
    }

    function editAd(id, date, userName) {
        let editForm = $("#formEditAd");
        let publisher = userName;
        let description = editForm.find('[name="description"]').val();
        let title = editForm.find('[name="title"]').val();
        let img = editForm.find('[name="image"]').val();
        let price = editForm.find('[name="price"]').val();

        let curAd = {
            title,
            publisher,
            description,
            img,
            price,
            date
        };
        if (title.length == 0) {
            showError("Title cannot be empty!");
            return;
        }
        if (price.length == 0) {
            showError("Price cannot be empty!");
            return;
        }
        $.ajax({
            method: 'PUT',
            url: baseUrl + '/appdata/' + appKey + "/prodavachnik/" + id,
            headers: {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(curAd),
            success: successEditAd,
            error: handleError
        });
        function successEditAd() {
            listAdsView();
            showInfo('Success edit ad!');
        }
    }

    function login() {
        let formLogin = $("#formLogin");
        let username = formLogin.find(`input[name="username"]`).val();
        let password = formLogin.find(`input[name="passwd"]`).val();

        $.ajax({
            url: baseUrl + "/user/" + appKey + "/login",
            method: "POST",
            headers: {
                'Authorization': 'Basic ' + btoa(appKey + ":" + appSecret),
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({username, password}),
            success: successLogin,
            error: handleError
        });

        function successLogin(data) {
            saveSessionStorage(data);
            listAdsView();
            showInfo("Login success!");
        }
    }

    function logout() {
        $.ajax({
            url: baseUrl + '/user/' + appKey + "/_logout",
            method: 'POST',
            headers: {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
                'Content-Type': 'application/json'
            },
            success: successLogout,
            error: handleError
        });

        function successLogout(a) {
            sessionStorage.clear();
            homeView();
            showInfo("Logout success!");
        }
    }

    function register() {
        let formLogin = $("#formRegister");
        let username = formLogin.find(`input[name="username"]`).val();
        let password = formLogin.find(`input[name="passwd"]`).val();

        if (username.length == 0) {
            showError("Username cannot be empty!");
            return;
        }
        if (password.length == 0) {
            showError("Password cannot be empty!");
            return;
        } else {
            $.ajax({
                url: baseUrl + "/user/" + appKey,
                method: "POST",
                headers: {
                    'Authorization': 'Basic ' + btoa(appKey + ":" + appSecret),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({username, password}),
                success: successRegistration,
                error: handleError
            });
        }


        function successRegistration(data) {
            saveSessionStorage(data);
            listAdsView();
            showInfo("Registration success!");
        }
    }

    function makeEditAdView(ad) {
        editAdView();
        let date = ad.date;
        let id = ad._id;
        let userName = ad.publisher;
        let editForm = $('#formEditAd');
        editForm.find('input[name=title]').val(ad.title);
        editForm.find('textarea[name=description]').val(ad.description);
        editForm.find('input[name=image]').val(ad.img);
        editForm.find('input[name=price]').val(ad.price);
        $("#buttonEditAd").click(() => editAd(id, date, userName));
    }


    function setGreeting() {
        if (sessionStorage.getItem('authToken')) {
            $("#menu #loggedInUser").text(`Welcome, ${sessionStorage.getItem('userName')}!`).show();
        } else {
            $("#menu #loggedInUser").text(``).hide();
        }
    }

    function handleError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showInfo(message) {
        $('#infoBox').text(message).fadeIn(500);
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 2000);
    }

    function showError(message) {
        $('#errorBox').text(message);
        $('#errorBox').show();
    }
}