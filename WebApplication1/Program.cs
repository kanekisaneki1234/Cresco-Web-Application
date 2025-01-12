using WebApplication1.Controllers.public_classes;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddScoped<IUploadHandler, UploadHandler>();
builder.Services.AddScoped<IHtmlDataHandler, HtmlDataHandler>();
builder.Services.AddScoped<IDocumentHandler, DocumentHandler>();

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowAll", policy =>
//         policy.AllowAnyOrigin()
//               .AllowAnyMethod()
//               .AllowAnyHeader());
// });

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Add your React frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.UseDeveloperExceptionPage();

app.UseCors("ReactAppPolicy");

app.Run();
