# How to use this ?
Copy and paste the `.env.example` and name it `.env`.

Now you fill in the `token` you get from `glass.santio.me` should look like this:
```
# The socket the standalone connects to.
base_url = "wss://glassapi.santio.me/"

# The token used to identify your server and is provided by the website.
token    = "3bc2e..."
```

To specify which directory the file manager should start from you do `yarn dist --start_dir=...`
(If you dont specify a directory it will be `process.cwd()` by default)

# Learn More:
`yarn dist --help`

Now you can manage files on your computer or vps/dedicated server from `glass.santio.me`.

# Screenshots

![image](https://user-images.githubusercontent.com/76548041/230159307-688b8c19-7f2c-4f0b-84f9-3d7b81a13e7b.png)
![image](https://user-images.githubusercontent.com/76548041/230159357-a3129ccc-debb-4f17-99c0-d362c517803f.png)
![image](https://user-images.githubusercontent.com/76548041/230201174-a2c1165e-e8e7-4e87-b3a8-77b1920960b5.png)
![image](https://user-images.githubusercontent.com/76548041/230201267-0c61d401-1102-4eb6-87e4-0e5c5b6eebe2.png)
![image](https://user-images.githubusercontent.com/76548041/230201358-6e02af6a-d5d3-4a29-a19f-897e6f058bba.png)

**WARNING FTP may not work yet and you can't run commands from the console like if you have ssh'd into the server this may be a feature soon!**
