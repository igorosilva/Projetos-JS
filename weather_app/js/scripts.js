$(function () {
    var accuweatherAPIKey = "";
    var openweatherAPIKey = "";

    var weatherObject = {
        cidade: "",
        estado: "",
        pais: "",
        temperatura: "",
        texto_clima: "",
        icone_clima: ""
    };

    function preencherClimaAgora(cidade, estado, pais, temperatura, texto_clima, icone_clima) {
        var texto_local = cidade + ", " + estado + ". " + pais;

        $("#texto_local").text(texto_local);
        $("#texto_temperatura").html(String(temperatura) + "&deg;");
        $("#texto_clima").text(texto_clima);
        $("#icone_clima").css("background-image", "url('" + weatherObject.icone_clima + "')");
    }

    function preencherPrevisao5Dias(previsoes) {
        $("#info_5dias").html("");

        var diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

        for (var i = 0; i < previsoes.length; i++) {
            var dataHoje = new Date(previsoes[i].Date);
            var dia_semana = diasSemana[dataHoje.getDay()];

            var iconNumber = previsoes[i].Day.Icon <= 9 ? "0" + String(previsoes[i].Day.Icon) : String(previsoes[i].Day.Icon);

            iconeClima = "https://developer.accuweather.com/sites/default/files/" + iconNumber + "-s.png";

            maxima = String(previsoes[i].Temperature.Maximum.Value);
            minima = String(previsoes[i].Temperature.Minimum.Value);

            elementoHTMLDia = '<div class="day col">';
            elementoHTMLDia += '<div class="day_inner">';
            elementoHTMLDia += '<div class="dayname">';
            elementoHTMLDia += dia_semana;
            elementoHTMLDia += '</div>';
            elementoHTMLDia += '<div style="background-image: url(\'' + iconeClima + '\')" class="daily_weather_icon"></div>';
            elementoHTMLDia += '<div class="max_min_temp">';
            elementoHTMLDia += minima + '&deg; / ' + maxima + '&deg;';
            elementoHTMLDia += '</div>';
            elementoHTMLDia += '</div>';
            elementoHTMLDia += '</div>';

            $("#info_5dias").append(elementoHTMLDia);

            elementoHTMLDia = "";
        }
    }

    function gerarGrafico(horas, temperaturas) {
        Highcharts.chart('hourly_chart', {
            chart: {
                type: 'line'
            },
            title: {
                text: 'Temperatura hora a hora'
            },
            xAxis: {
                categories: horas
            },
            yAxis: {
                title: {
                    text: 'Temperatura (°C)'
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
            series: [{
                showInLegend: false,
                data: temperaturas
            }]
        });
    }

    gerarGrafico();

    function pegarPrevisaoHoraAHora(localCode) {
        {
            $.ajax({
                url: "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
                type: "GET",
                dataType: "json",
                success: function (data) {
                    var horarios = [];
                    var temperaturas = [];

                    for (var i = 0; i < data.length; i++) {
                        var hora = new Date(data[i].DateTime).getHours();

                        horarios.push(String(hora) + "h");
                        temperaturas.push(data[i].Temperature.Value);

                        gerarGrafico(horarios, temperaturas);
                    }
                },
                error: function () {
                    gerarErro("Erro ao obter a previsão hora a hora");
                }
            });
        }
    }

    function pegarPrevisao5Dias(localCode) {
        $.ajax({
            url: "http://dataservice.accuweather.com/forecasts/v1/daily/5day/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function (data) {
                $("#texto_max_min").html(String(data.DailyForecasts[0].Temperature.Minimum.Value) + "&deg; / " + String(data.DailyForecasts[0].Temperature.Maximum.Value) + "&deg;");

                preencherPrevisao5Dias(data.DailyForecasts);
            },
            error: function () {
                gerarErro("Erro ao obter a previsão de 5 dias");
            }
        });
    }

    function pegarTempoAtual(localCode) {
        $.ajax({
            url: "http://dataservice.accuweather.com/currentconditions/v1/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function (data) {
                weatherObject.temperatura = data[0].Temperature.Metric.Value;
                weatherObject.texto_clima = data[0].WeatherText;

                var iconNumber = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : String(data[0].WeatherIcon);

                weatherObject.icone_clima = "https://developer.accuweather.com/sites/default/files/" + iconNumber + "-s.png";

                preencherClimaAgora(weatherObject.cidade, weatherObject.estado, weatherObject.pais, weatherObject.temperatura, weatherObject.texto_clima, weatherObject.icone_clima);
            },
            error: function () {
                gerarErro("Erro ao obter o clima atual");
            }
        });
    }

    function pegarLocalUsuario(lat, long) {
        $.ajax({
            url: "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=" + accuweatherAPIKey + "&q=" + lat + "%2C" + long + "&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function (data) {
                var localCode = data.Key;

                try {
                    weatherObject.cidade = data.ParentCity.LocalizedName;
                } catch {
                    weatherObject.cidade = data.LocalizedName;
                }

                weatherObject.estado = data.AdministrativeArea.LocalizedName;
                weatherObject.pais = data.Country.LocalizedName;

                pegarTempoAtual(localCode);
                pegarPrevisao5Dias(localCode);
                pegarPrevisaoHoraAHora(localCode)
            },
            error: function () {
                gerarErro("Erro no código do local");
            }
        });
    }

    function pegarCoordenadasDaPesquisa(input) {
        input = encodeURI(input);

        $.ajax({
            url: "http://api.openweathermap.org/geo/1.0/direct?q=" + input + "&appid=" + openweatherAPIKey,
            type: "GET",
            dataType: "json",
            success: function (data) {
                try {
                    var long = data[0].lon;
                    var lat = data[0].lat;


                    pegarLocalUsuario(lat, long);
                } catch {
                    gerarErro("Erro na pesquisa do local");
                }
            },
            error: function () {
                gerarErro("Erro na pesquisa do local");
            }
        });
    }

    function pegarCoordenadasDoIP() {
        var lat_padrao = -23.56267278244844;
        var long_padrao = -46.660001808500176;

        $.ajax({
            url: "http://www.geoplugin.net/json.gp",
            type: "GET",
            dataType: "json",
            success: function (data) {
                if (data.geoplugin_latitude && data.geoplugin_longitude) {
                    pegarLocalUsuario(data.geoplugin_latitude, data.geoplugin_longitude);
                } else {
                    pegarLocalUsuario(lat_padrao, long_padrao);
                }
            },
            error: function () {
                pegarLocalUsuario(lat_padrao, long_padrao);
            }
        });
    }

    function gerarErro(mensagem) {
        if (!mensagem) {
            mensagem = "Erro na solicitação";
        }

        $("#aviso-erro").text(mensagem);

        $("#aviso-erro").slideDown();
        window.setTimeout(function () {
            $("#aviso-erro").slideUp();
        }, 4000);
    }

    pegarCoordenadasDoIP();

    $("#search-button").click(function () {
        var local = $("input#local").val();

        if (local) {
            pegarCoordenadasDaPesquisa(local);
        } else {
            alert('Local inválido');
        }
    });

    $("input#local").on('keypress', function (e) {
        if (e.which == 13) {
            var local = $("input#local").val();

            if (local) {
                pegarCoordenadasDaPesquisa(local);
            } else {
                alert('Local inválido');
            }
        }
    });

});
